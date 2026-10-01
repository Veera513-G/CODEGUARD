export interface CodeChunk {
  id: string;
  name: string;
  lineStart: number;
  lineEnd: number;
  code: string;
}

export function chunkLargeCode(code: string, language: string): CodeChunk[] {
  const lines = code.split("\n");
  if (lines.length <= 400) {
    return [
      {
        id: "chunk-main",
        name: "Full File",
        lineStart: 1,
        lineEnd: lines.length,
        code,
      },
    ];
  }

  const chunks: CodeChunk[] = [];
  let currentChunkLines: string[] = [];
  let chunkStart = 1;
  let chunkName = "Module Header";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect function / class boundaries
    if (
      /^(export\s+)?(async\s+)?(function\s+\w+|class\s+\w+|const\s+\w+\s*=\s*(async\s*)?\(|def\s+\w+|public\s+|private\s+)/.test(
        line.trim()
      )
    ) {
      if (currentChunkLines.length >= 100) {
        chunks.push({
          id: `chunk-${chunks.length + 1}`,
          name: chunkName,
          lineStart: chunkStart,
          lineEnd: lineNum - 1,
          code: currentChunkLines.join("\n"),
        });
        currentChunkLines = [];
        chunkStart = lineNum;
        chunkName = line.trim().slice(0, 40);
      }
    }

    currentChunkLines.push(line);
  }

  if (currentChunkLines.length > 0) {
    chunks.push({
      id: `chunk-${chunks.length + 1}`,
      name: chunkName,
      lineStart: chunkStart,
      lineEnd: lines.length,
      code: currentChunkLines.join("\n"),
    });
  }

  return chunks;
}
