// Runs the harness for one answer in a locked-down child process and reads back the results.
import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HarnessOutput } from './types.ts';

const SRC = dirname(fileURLToPath(import.meta.url));
const TIMEOUT_MS = 10_000;

// Node renamed these flags as the features matured (--experimental-permission became --permission in Node 23.5).
// Ask this Node which names it knows, so Intact runs on 22, 24 and later. A wrong name stops every answer from loading.
const known = process.allowedNodeEnvironmentFlags;
const PERMISSION = known.has('--permission') ? '--permission' : '--experimental-permission';
const STRIP_TYPES = known.has('--experimental-strip-types') ? ['--experimental-strip-types'] : [];

// Node's permission model: the child may read the harness source and the answer, and nothing else.
// No file writes, no child processes, no workers. It does not block the network, so run untrusted models in a container.
export function check(providerId: string, answerPath: string): Promise<HarnessOutput> {
  const answer = resolve(answerPath);
  const args = [
    ...STRIP_TYPES, '--no-warnings',
    PERMISSION, `--allow-fs-read=${SRC}`, `--allow-fs-read=${answer}`,
    resolve(SRC, 'harness.ts'), providerId, answer,
  ];
  return new Promise((done) => {
    execFile(process.execPath, args, { timeout: TIMEOUT_MS, maxBuffer: 1 << 20 }, (err, stdout, stderr) => {
      if (stdout) {
        try { return done(JSON.parse(stdout)); } catch { /* fall through */ }
      }
      const why = (err as any)?.killed ? `timed out after ${TIMEOUT_MS / 1000}s` : (stderr || String(err)).trim().split('\n').slice(-3).join(' ');
      done({ loaded: false, error: why.slice(0, 300) });
    });
  });
}
