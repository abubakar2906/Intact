# Intact: webhook signatures (side test)

**How reliably do AI models write payment integrations that actually work?**

Developers now ask AI models to write their payment code. When that code is wrong, the failure is quiet: a real payment gets rejected, or a fake one gets accepted. Intact measures how often each model gets it right, provider by provider.

## What it tests today

One task, two providers: **verify a webhook signature** for Paystack and for Stripe.

It's the first thing every payment integration needs, and the easiest to get subtly wrong. A webhook is how the provider tells you a payment happened. If you don't check its signature properly, anyone who finds your URL can tell you they paid.

Each model gets the same short prompt (`webhooks/prompt.ts`): write `verify(rawBody, headers, secret)` for this provider. It isn't given the provider's docs, the header name, the hashing scheme, or anything about time. Intact measures what the model knows, the way a developer asks with no docs to hand.

## How an answer is scored

The model's code is run against a fixed set of webhooks (`webhooks/providers/`): some real, some forged or tampered with.

- **must** checks decide pass or fail. Getting one wrong means real payments are rejected or fake ones are accepted.
  - Paystack: a valid webhook, a valid one with spaced-out JSON (re-serialising the body breaks it), a tampered amount, the wrong secret, a missing or empty header, and a short garbage signature (which must return false, not crash).
  - Stripe: the same, plus a webhook too old to accept (a replay), an old signature with a fresh timestamp pasted in, and malformed headers.
- **should** checks are stricter behaviour a careful engineer adds. They're reported but don't decide pass or fail. For example: rejecting a valid signature with junk stuck on the end, or accepting any of the several signatures Stripe sends while a secret is being rotated.

A sample **passes** when every must check passes. Each model answers several times (5 by default), because models don't give the same answer twice.

## Can the checks be trusted?

`npm run webhooks:selfcheck` tests the tests. A correct reference verifier must pass every check, and deliberately broken versions must fail exactly the checks they were written to fail: one that re-serialises the body, one that crashes on a short signature, one that skips the age check, and so on (`webhooks/references/`). If the self-check fails, the benchmark is wrong, not the models.

## Run it

Needs Node 22 or newer, and an [OpenRouter](https://openrouter.ai) API key (one key reaches every model). No packages to install.

```sh
npm run webhooks:selfcheck                                   # check the checks
npm run webhooks:bench -- --models reference --samples 2     # free dry run, no API calls
export OPENROUTER_API_KEY=...                       # never commit this
npm run webhooks:bench -- --models anthropic/<model>,openai/<model>,google/<model> --samples 5
```

Use the exact model ids from OpenRouter's model list. Each run saves every reply, every extracted answer and a `summary.md` under `runs/<time>/`.

### Running it for free

- **OpenRouter's free models.** Use ids ending in `:free`. They're rate limited (check OpenRouter's current daily limit), so keep runs small and use `--concurrency 1`.
- **Any other OpenAI-compatible service.** Point Intact at it with two variables:
  ```sh
  export INTACT_BASE_URL=https://api.groq.com/openai/v1    # Groq's free tier
  export INTACT_API_KEY=...
  npm run webhooks:bench -- --models <groq model id> --samples 5 --concurrency 1
  ```
  A local Ollama works the same way with `INTACT_BASE_URL=http://localhost:11434/v1` and no key.
- **By hand, with free chat apps.** Print the prompt, paste it into ChatGPT, Claude or Gemini, save each whole reply to a file, and grade the files:
  ```sh
  npm run webhooks:prompt -- paystack                 # the exact prompt to paste
  npm run webhooks:grade -- paystack replies/*.md     # PASS or FAIL, and which checks failed
  ```
  Start a new chat for every sample, so earlier answers don't influence the next one.

## Safety

Model-written code runs on your machine. Each answer runs in its own Node process with the permission model on: it can read only its own file and the harness, with no file writes and no child processes, and it's stopped after 10 seconds. Node's permission model does not block the network, so run unfamiliar models inside a container. Only test secrets are used. Never point this at live keys.

## Reading the results honestly

- It's one task. A model that verifies webhooks well may still get refunds or idempotency wrong.
- Providers change their schemes. The cases follow Paystack's and Stripe's documented schemes as of November 2026.
- No docs in the prompt is a choice. With docs pasted in, results would likely be better; that's a second condition worth adding.
- A model's answer can fail on format (no `verify` export, a package import). These are counted separately as "did not load", not as wrong.

## The code, in the order to read it

1. `webhooks/prompt.ts`: exactly what every model is asked.
2. `webhooks/providers/paystack.ts` and `webhooks/providers/stripe.ts`: the cases, each with a line on why it matters.
3. `webhooks/harness.ts`: runs one answer against the cases, with the clock frozen at the moment the webhooks "arrive".
4. `webhooks/check.ts`: runs the harness in a locked-down child process.
5. `webhooks/run.ts`: asks the models, checks the answers, writes the summary.

## What's next

- More providers, once their schemes are confirmed against current docs: Flutterwave, Monnify, Polar.
- More tasks: idempotent payment handling, refunds, a webhook for a payment that was abandoned.
- A second condition with the provider's docs in the prompt.
