# Intact: notes for Claude sessions

Read this first, then `README.md` and `PLAN.md`. `PLAN.md` is the source of truth for what each run tests and why.

## What Intact is

Two parts, one name:

1. **The benchmark** (this repo, public, MIT). Agents get payment tools from Ledgerline, a made-up provider that fails the way real ones do: stale statuses, late webhooks, a supplier who insists. We grade where the money went, not what the agent said. Every try is published.
2. **The platform** (a separate private repo, `intact-platform`). A guard that sits between an agent and its payment tools, and a dashboard. Nothing from that repo comes into this one. This repo only describes the platform in public words, the way the home page does.

The guard is one part of the platform. It is not the headline of the site.

## How we work

- **Plain English.** Short sentences in code comments, commits and copy. No em dashes.
- **Recommend, don't list.** When the right call is clear, make it and say why.
- **Show before building big design changes.** Render a mock-up, screenshot it, and show it before it goes into the site.
- **Adapt references, never copy them.** When the owner shares a design reference, work out what makes it good (type, depth, spacing, motion) and fit that to Intact. Never clone its layout or content.
- **Check what you made, rendered.** Desktop 1440 wide and phone 375 wide, in light and in dark. Reading the code is not checking.
- **Finish the job.** If part is blocked, do the rest and say plainly what is left.

## Hard rules

- **Never ask for API keys in chat and never write them to files.** In the cloud environment, keys live in the environment's network secrets and the proxy adds them. Run the probe with `INTACT_API_KEY=proxy` (it then sends no auth header) and `NODE_USE_ENV_PROXY=1` (Node's fetch ignores the proxy without it).
- **Never commit** `node_modules`, `.next`, `site/src/data/generated`, `site/public/runs` or `site/public/data`. They are built.
- **Write the plan before the run.** A new run gets its section in `PLAN.md` first: the question, setups, models, tries, what counts.
- **Never weaken a grade to make a result look better.** Grades come from the tool calls Ledgerline recorded.
- **Pushing to `main` deploys the site** (Vercel, project root `site/`). Run the build first.
- Keep anything about the owner's employer and other projects out of this repo.

## Layout

- `probe/` the benchmark: `world.ts` (Ledgerline), `scenarios.ts` (the traps), `conditions.ts` (the setups: A, B, C, D, TAU, STRIPE), `agent.ts` (calls the model), `pace.ts` (rate limits and waits), `run.ts`, `publish.ts`.
- `runs/` raw runs in progress (gitignored, except runs force-added so a new session can resume them).
- `results/` published runs. `npm run publish` turns a run into a result, keeping one line per try (the last attempt).
- `docs/` method notes: `model-choice.md` (which models and why, from OpenRouter tool-call rankings), `public-prompts.md` (the 12 public payment-agent prompts tally).
- `site/` the Next.js 16 site, Tailwind 4. `site/scripts/build-data.ts` builds the data the pages read (it runs before `dev` and `build`).
- `webhooks/` a separate, earlier benchmark on webhook handling.

## Commands

```bash
npm run probe -- --help          # flags: --resume, --rescore, --parallel, --budget
npm run probe:selfcheck
npm run publish -- <run folder>
cd site && npm run dev           # or: npm run build && npx next start
cd site && npm run lint && npx tsc --noEmit -p .
```

## Where the runs are (27 November 2026)

- **Experiment 01, the stale payout.** Published. 5 open models, 10 tries each, 4 setups. Paid twice: no hint 29/50, a note in the docs 23/50, one sentence 1/50, a lock in the tool 0/49.
- **Pushback run** (the supplier insists after the agent holds off). Groq half published (`results/probe-2026-11-26T09-57-02-insist-groq`, 80 tries). The NVIDIA half is in `runs/probe-2026-11-26T09-57-33`: GLM has 30 tries left and its endpoint was down. Resume with `--resume`.
  - Exploratory finding, not written up yet: of the agents that held off and reached the pushback, the share that then paid anyway was TAU 9/37, STRIPE 7/36, one sentence 6/38, no hint 1/13. Rules in the prompt make agents stop, then many give in. Write it into `PLAN.md`, the site and the updates list when the owner asks.
- **Kimi recheck:** 4/10 on the same setup it scored 2 and 7 on before. The swing is chance. Noted in `PLAN.md`.
- **Gemini free-tier run:** `runs/probe-2026-11-26T14-05-04`, 8 of 80 done. The free tier allows 20 requests a day per model. Gemini is not in the tool-call rankings, so stopping it is the recommendation; the owner has not decided.
- **Third run** (the models agents actually run on, Opus as the ceiling): planned in `PLAN.md`, waiting on credits. When a key arrives it goes in as a network secret. Run one test try per model first.

## The site

Live at https://intact-bench.vercel.app. The home and experiment pages were redesigned on 27 November 2026. The method and results-list pages still have the older look.

**Home page (`site/src/app/page.tsx`).** Problem, fix, results, with as little text as possible (the owner's call on 27 November: show the problem, how it is solved, and the results; no filler).
- **Hero:** "AI agents pay twice. Intact measures it, and stops it." with `TryField`. No paragraph under it.
- **The problem** (band): Qwen 3.8 27B's no-hint try 2 (`Exhibit`) beside Chidi's bank statement (`TwoRecords`), replaying when reached (`Play`).
- **The fix:** `GuardFlow`, the rules as one-line items, the dashboard picture (`ScrollScale`).
- **The results** (band): `Findings` and `Ladder`.
- **What is public,** updates, then the close with the gate mark.
- **Experiment page:** the same hero pair, then chapters: results with a colour key, the beats (one line each) beside their visuals, `ScrollStory` (how Intact grades it), every try with downloads, the setup and limits, the citation.
- Every figure is read from the published run. The featured try is `exhibit` in `content/experiments.ts`.

**The look.**
- **Font:** Google Sans Flex with the roundness axis at 40 (`--font-soft`, set in `layout.tsx`), weight 600 for headings. Geist Mono only for times, counts and small data. The older pages use Inter Tight and Geist.
- **Colour has one meaning each.** Red is money that went wrong, green is money kept, amber is waiting for a person. Never decoration.
- **Lit surfaces:** a gradient a little lighter at the top, a 1px edge that catches the light, and almost no drop shadow. The primary button is white on dark and near-black on light.
- **Logo mark:** a rounded square with a slot cut in it (`.intact-mark` in `globals.css`). It stands for a gate.
- **Light and dark.** The theme follows the device until someone picks one. The pick is saved in `localStorage` under `intact-theme` and applied before first paint by the script in `layout.tsx`. All home tokens are in `globals.css` under `.home` and `[data-theme='dark'] .home`. The canvas reads the `--try-*` variables and redraws when the theme changes.

**Design skills, in this order:** frontend-design for direction, dataviz for charts, emil-design-eng for interactions and motion, then unslop as the final pass. Respect `prefers-reduced-motion`.

## Next jobs on the site

As of 27 November, after the chapters redesign:

1. **Keep text short.** A heading and the visual. Add a sentence only when the visual cannot say it.
2. **Platform copy:** say only what the owner has chosen to say in public. Never copy wording from the private repo's plan into this one, not even in a comment.
3. **The red glow on the hero blocks:** unslop counts coloured glows as a tell. The owner has not decided.
4. **Design skills** are in `.claude/skills/`: frontend-design (Anthropic, Apache 2.0), emil-design-eng and choreograph (Emil Kowalski, MIT), unslop (CC BY 4.0). Use them in that order, with dataviz for charts.
5. **Dev server note:** Turbopack's Tailwind loader can keep serving old CSS. Restart `next dev` with `.next/dev` removed after CSS edits, and never run `next build` beside a running dev server.
