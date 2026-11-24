/**
 * SECRET SCAN GUARD (adopsi pola "secret hygiene" dari
 * `mukul975/Anthropic-Cybersecurity-Skills`).
 *
 * Tujuan: mencegah API key / token berakhir di source code, log, atau response.
 * Dipakai oleh unit test (`tests/ai-resilience-v9.test.ts`) sebagai gerbang
 * sebelum commit, sehingga kebocoran terdeteksi otomatis.
 */

export interface SecretMatch {
  patternId: string;
  file: string;
  line: number;
  preview: string;
}

interface SecretPattern {
  id: string;
  label: string;
  regex: RegExp;
}

/** Pola key nyata (bukan placeholder/dokumentasi). */
export const SECRET_PATTERNS: SecretPattern[] = [
  { id: "gemini", label: "Google Gemini API key", regex: /\bAIza[0-9A-Za-z\-_]{30,}\b/ },
  { id: "groq", label: "Groq API key", regex: /\bgsk_[0-9A-Za-z]{30,}\b/ },
  { id: "openrouter", label: "OpenRouter API key", regex: /\bsk-or-v1-[0-9A-Za-z]{24,}\b/ },
  { id: "openai", label: "OpenAI/Anthropic style key", regex: /\bsk-(?:ant-)?[0-9A-Za-z]{32,}\b/ },
  { id: "aws", label: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: "github", label: "GitHub token", regex: /\bgh[pousr]_[0-9A-Za-z]{30,}\b/ },
  { id: "slack", label: "Slack token", regex: /\bxox[abprs]-[0-9A-Za-z-]{20,}\b/ },
];

/** Placeholder yang memang sengaja ada di kode/dokumentasi. */
const ALLOWED_SUBSTRINGS = [
  "YOUR_API_KEY",
  "your_api_key",
  "REDACTED",
  "[REDACTED",
  "xmpl",
  "example",
  "placeholder",
  "gsk_xxx",
  "AIzaSyD-EXAMPLE",
];

function isAllowed(line: string): boolean {
  const lower = line.toLowerCase();
  return ALLOWED_SUBSTRINGS.some((token) => lower.includes(token.toLowerCase()));
}

/** Scan satu file (dipisah per baris). */
export function scanTextForSecrets(file: string, content: string): SecretMatch[] {
  const matches: SecretMatch[] = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isAllowed(line)) continue;
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(line)) {
        matches.push({
          patternId: pattern.id,
          file,
          line: i + 1,
          // Jangan bocorkan nilai key-nya, cukup awalannya
          preview: `${pattern.label} terdeteksi (${line.trim().slice(0, 6)}…)`,
        });
      }
    }
  }
  return matches;
}

export function formatSecretReport(matches: SecretMatch[]): string {
  if (matches.length === 0) return "Tidak ada API key hardcoded. ✅";
  return [
    `❌ ${matches.length} potensi secret hardcoded:`,
    ...matches.map((m) => `- ${m.file}:${m.line} → ${m.preview}`),
  ].join("\n");
}
