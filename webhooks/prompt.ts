// What each model is asked. One prompt for every model and provider, so differences in results come from the model, not the wording.
// Deliberately left out: the provider's docs, the header name, the hashing scheme and anything about time.
// Intact measures what a model knows about a provider, the way a developer would ask it with no docs to hand.
import type { Provider } from './types.ts';

export function prompt(p: Provider): string {
  return `Write a TypeScript function that verifies ${p.name} webhook signatures.

Export exactly this function:

export function verify(rawBody: string, headers: Record<string, string | undefined>, secret: string): boolean

- rawBody is the request body exactly as received, as a string.
- headers are the request headers, with lowercase names, as Node.js gives them.
- secret is ${p.secretDescription}.

Return true only if the webhook genuinely came from ${p.name} and is safe to process. Otherwise return false. It must never throw.
Use only Node.js built-in modules, imported from "node:crypto" or similar. No other packages.
Reply with the complete code in a single \`\`\`ts block.`;
}

// Takes the first fenced code block from a reply, or the whole reply if there is none.
export function extractCode(reply: string): string {
  const m = reply.match(/```(?:ts|typescript|js|javascript)?[^\n]*\n([\s\S]*?)```/);
  return (m ? m[1] : reply).trim() + '\n';
}

// Lists what the code imports, so answers that reach for packages can be reported.
export function imports(code: string): string[] {
  const found = [...code.matchAll(/(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
  return [...new Set(found)];
}

export const usesConstantTime = (code: string) => /timingSafeEqual/.test(code);
