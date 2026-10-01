/**
 * Syntax validation and lexical structure verification across supported languages.
 */

export interface SyntaxValidationResult {
  valid: boolean;
  errors: Array<{
    line: number;
    message: string;
    snippet?: string;
  }>;
}

export function validateSyntax(code: string, language: string): SyntaxValidationResult {
  const errors: Array<{ line: number; message: string; snippet?: string }> = [];
  const lines = code.split("\n");
  const lang = (language || "").toLowerCase();

  // 1. Bracket & Parenthesis Balance Checker
  const stack: Array<{ char: string; line: number }> = [];
  const pairs: Record<string, string> = { "(": ")", "{": "}", "[": "]" };
  const inversePairs: Record<string, string> = { ")": "(", "}": "{", "]": "[" };

  let inString: string | null = null;
  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const prevChar = j > 0 ? line[j - 1] : "";
      const nextChar = j < line.length - 1 ? line[j + 1] : "";

      // Multi-line comment toggle
      if (char === "/" && nextChar === "*" && !inString) {
        inComment = true;
        j++;
        continue;
      }
      if (char === "*" && nextChar === "/" && inComment) {
        inComment = false;
        j++;
        continue;
      }
      if (inComment) continue;

      // Single-line comment check
      if (!inString) {
        if (char === "/" && nextChar === "/") break; // JS, TS, Java, C, C++, C#, Go, Rust, PHP
        if (char === "#" && (lang === "python" || lang === "php")) break; // Python, PHP
      }

      // String quote tracking
      if ((char === '"' || char === "'" || char === "`") && prevChar !== "\\") {
        if (!inString) {
          inString = char;
        } else if (inString === char) {
          inString = null;
        }
        continue;
      }

      if (inString) continue;

      // Track opening/closing brackets
      if (pairs[char]) {
        stack.push({ char, line: lineNum });
      } else if (inversePairs[char]) {
        if (stack.length === 0) {
          errors.push({
            line: lineNum,
            message: `Unmatched closing bracket '${char}' without corresponding '${inversePairs[char]}'`,
            snippet: line.trim(),
          });
        } else {
          const last = stack.pop()!;
          if (pairs[last.char] !== char) {
            errors.push({
              line: lineNum,
              message: `Mismatched bracket: expected '${pairs[last.char]}' for '${last.char}' from line ${last.line}, but found '${char}'`,
              snippet: line.trim(),
            });
          }
        }
      }
    }
  }

  // Check remaining unclosed brackets
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    errors.push({
      line: unclosed.line,
      message: `Unclosed delimiter '${unclosed.char}' opened on line ${unclosed.line}`,
      snippet: lines[unclosed.line - 1]?.trim(),
    });
  }

  // 2. Python specific indentation & colon syntax
  if (lang === "python") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      // Check missing colon on control keywords
      if (
        /^(def\s+\w+\(.*\)|if\s+.*|elif\s+.*|else|while\s+.*|for\s+.*|class\s+\w+.*|try|except.*|finally)$/.test(
          trimmed
        ) &&
        !trimmed.endsWith(":") &&
        !trimmed.startsWith("#")
      ) {
        errors.push({
          line: lineNum,
          message: `SyntaxError: Expected ':' at the end of '${trimmed.split(/\s+/)[0]}' statement`,
          snippet: trimmed,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
