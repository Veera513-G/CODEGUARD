import type { AnalyzedFinding } from "./ast-rules";

export function runSecurityScan(code: string, language: string): AnalyzedFinding[] {
  const findings: AnalyzedFinding[] = [];
  const lines = code.split("\n");
  const lower = code.toLowerCase();
  const lang = (language || "").toLowerCase();

  const findLines = (pattern: RegExp): Array<{ lineNum: number; text: string }> => {
    const matches: Array<{ lineNum: number; text: string }> = [];
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        matches.push({ lineNum: i + 1, text: lines[i] });
      }
    }
    return matches;
  };

  // ─── 1. SQL Injection / Raw Dynamic SQL Construction ───────────────────────
  const sqlDynamicMatches = findLines(
    /(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|DROP\s+TABLE)[\s\S]*(\+|`|%s|\.format\(|\${|f["'])/i
  );
  for (const match of sqlDynamicMatches) {
    if (!match.text.includes("?") && !match.text.includes("$1") && !match.text.includes(":")) {
      findings.push({
        id: `sec-sql-injection-${match.lineNum}`,
        type: "SECURITY",
        severity: "CRITICAL",
        title: "CWE-89 / OWASP A03: SQL Injection via Dynamic Query Concatenation",
        description:
          "Direct concatenation of input variables into database queries enables attackers to bypass authentication, exfiltrate data, or drop entire tables.",
        lineStart: match.lineNum,
        lineEnd: match.lineNum,
        suggestion:
          "Replace string concatenation with parameterized SQL queries (e.g. prepared statements or ORM queries).",
        fixedCode:
          lang === "python"
            ? `cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))`
            : `const user = await prisma.user.findUnique({ where: { id: userId } });`,
        confidence: "CONFIRMED",
        reason: "SQL query constructed dynamically via string interpolation or concatenation.",
        impact: "Complete database compromise, data leakage, and authentication bypass.",
        attackSurface: "Database Client / Query Execution Layer",
        evidence: match.text.trim(),
      });
      break;
    }
  }

  // ─── 2. Hardcoded Secrets & Production Keys ────────────────────────────────
  const secretMatches = findLines(
    /(("|')(ak_live_|sk_live_|ghp_|eyJhbGci|secret_key|api_key|password\s*=\s*['"][^'"]{6,}['"]|token\s*=\s*['"][^'"]{8,}['"]|bearer\s+))/i
  );
  for (const match of secretMatches) {
    // Exclude test mocks if explicit
    if (!match.text.includes("process.env") && !match.text.includes("os.environ")) {
      findings.push({
        id: `sec-hardcoded-secret-${match.lineNum}`,
        type: "SECURITY",
        severity: "HIGH",
        title: "CWE-798 / OWASP A07: Hardcoded Credentials & API Secrets in Source",
        description:
          "Live cryptographic keys, database passwords, or third-party service tokens are embedded directly in source code.",
        lineStart: match.lineNum,
        lineEnd: match.lineNum,
        suggestion:
          "Extract all credentials to environment variables (.env / Secret Manager) injected at runtime.",
        fixedCode:
          lang === "python"
            ? `API_KEY = os.environ.get("API_KEY")`
            : `const apiKey = process.env.API_KEY;\nif (!apiKey) throw new Error("Missing API_KEY");`,
        confidence: "CONFIRMED",
        reason: "Secret tokens and credentials discovered in plaintext source.",
        impact: "Credential theft, unauthorized API access, and repository leakage.",
        attackSurface: "Version Control / Binary Decompilation",
        evidence: match.text.trim(),
      });
    }
  }

  // ─── 3. Unsafe Code Evaluation & Command Injection ─────────────────────────
  const evalMatches = findLines(/\b(eval\(|Function\(|child_process\.exec\(|os\.system\(|subprocess\.Popen\([^,]+shell=True)/);
  for (const match of evalMatches) {
    findings.push({
      id: `sec-command-injection-${match.lineNum}`,
      type: "SECURITY",
      severity: "CRITICAL",
      title: "CWE-78 / CWE-95: Command / Dynamic Code Injection (eval / exec)",
      description:
        "Direct invocation of 'eval()' or 'exec()' with untrusted inputs allows arbitrary remote code execution (RCE) on the server host.",
      lineStart: match.lineNum,
      lineEnd: match.lineNum,
      suggestion:
        "Avoid dynamic evaluation. Use structured JSON parsing or safe parameterized process execution (e.g. execFile / subprocess.run with arguments list).",
      confidence: "CONFIRMED",
      reason: "Execution of dynamic code interpreter or system shell with dynamic input.",
      impact: "Remote Code Execution (RCE) and full host system takeover.",
      attackSurface: "Server Runtime Execution Environment",
      evidence: match.text.trim(),
    });
  }

  // ─── 4. Cross-Site Scripting (XSS) via innerHTML ────────────────────────────
  const xssMatches = findLines(/\b(innerHTML\s*=|dangerouslySetInnerHTML|document\.write\()/);
  for (const match of xssMatches) {
    findings.push({
      id: `sec-xss-${match.lineNum}`,
      type: "SECURITY",
      severity: "HIGH",
      title: "CWE-79 / OWASP A03: Cross-Site Scripting (XSS) via Unsanitized DOM Write",
      description:
        "Injecting unescaped HTML into the DOM via innerHTML or dangerouslySetInnerHTML allows attackers to execute malicious client scripts.",
      lineStart: match.lineNum,
      lineEnd: match.lineNum,
      suggestion:
        "Use textContent / innerText or sanitize HTML using DOMPurify before rendering.",
      fixedCode: `element.textContent = sanitizedContent;`,
      confidence: "CONFIRMED",
      reason: "Direct assignment to innerHTML without sanitization bypasses React/DOM auto-escaping.",
      impact: "Session hijacking, credential harvesting, CSRF tokens theft.",
      attackSurface: "Client Browser DOM",
      evidence: match.text.trim(),
    });
  }

  // ─── 5. Path Traversal Risks ───────────────────────────────────────────────
  const pathTraversalMatches = findLines(/(fs\.(readFile|readFileSync|createReadStream|unlink)\s*\([^)]*(\+|`|\${))/);
  for (const match of pathTraversalMatches) {
    findings.push({
      id: `sec-path-traversal-${match.lineNum}`,
      type: "SECURITY",
      severity: "HIGH",
      title: "CWE-22 / OWASP A01: Potential Path Traversal via Unvalidated File Path",
      description:
        "File system access functions constructed with dynamic input can allow attackers to access sensitive system files using '../' dot-dot-slash notation.",
      lineStart: match.lineNum,
      lineEnd: match.lineNum,
      suggestion:
        "Validate and normalize paths using path.normalize() and verify that the target path begins with the allowed base directory.",
      fixedCode: `const safePath = path.resolve(BASE_DIR, path.normalize(fileName));\nif (!safePath.startsWith(BASE_DIR)) throw new Error("Path traversal forbidden");`,
      confidence: "LIKELY",
      reason: "Dynamic file path passed directly to file system read operation.",
      impact: "Arbitrary local file inclusion and exposure of system configuration / shadow files.",
      attackSurface: "Host File System",
      evidence: match.text.trim(),
    });
  }

  // ─── 6. Insecure Cryptography / Weak Randomness ────────────────────────────
  const weakRandomMatches = findLines(/Math\.random\(\)[\s\S]*(token|key|secret|password|id)/i);
  for (const match of weakRandomMatches) {
    findings.push({
      id: `sec-weak-random-${match.lineNum}`,
      type: "SECURITY",
      severity: "MEDIUM",
      title: "CWE-330: Use of Cryptographically Weak Pseudo-Random Number Generator",
      description:
        "Math.random() is predictable and unsuitable for generating security tokens, password reset links, or cryptographic session identifiers.",
      lineStart: match.lineNum,
      lineEnd: match.lineNum,
      suggestion: "Use crypto.randomUUID() or crypto.randomBytes() for secure tokens.",
      fixedCode: `import crypto from "crypto";\nconst secureToken = crypto.randomBytes(32).toString("hex");`,
      confidence: "CONFIRMED",
      reason: "Math.random() uses a predictable PRNG algorithm (xorshift128+).",
      impact: "Predictable session tokens and authorization bypass.",
      attackSurface: "Token Generation & Session Management",
      evidence: match.text.trim(),
    });
  }

  return findings;
}
