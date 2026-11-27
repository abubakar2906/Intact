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

Live at https://intact-bench.vercel.app. The home, experiment and method pages share one style (27 November 2026). The results list (`/experiments`) still has the older look.

**Home page (`site/src/app/page.tsx`).** Chosen on 27 November from three mock-ups: a research note (A) on a sidebar grid (B). Text is the centrepiece; taste goes into the figures and their motion.
- **Grid:** 80px margins, 12 columns. Columns 1 to 3 hold "Research lab", the experiment's facts, section numbers and figure numbers; the text reads in columns 4 to 9; figures run across all 12.
- **Opening:** "Intact is a research lab studying AI agents that move money.", then two paragraphs.
- **Figure 1:** `grid/StepChart`, the step chart from 29 to 0 across the setups, drawing once.
- **02, One sentence did what the docs could not,** then **Figure 2:** `note/OneSentence`, each model's ring sliding from its no-hint count to its one-sentence count.
- **Experiment page:** the same grid. Numbered sections, each with its figure: the try beside the bank's record (`TwoRecords`, `Exhibit`), a `StepChart` per model, `OneSentence` for the split (no hint to the docs note), the one slip with its whole reply, the public tally, then how grading works, every try (`TryGrid`), the setup, limits and citation.
- **Method page:** the same grid: the payment system, the tools, the traps (from the data), grading with one try as its figure, the public tally, the rules.
- **Shared:** `NxHeader`. Older pieces read the lab's tokens through aliases under `.nx` in `globals.css`, so they come out flat.
- Every figure is read from the published runs. The featured try is `exhibit` in `content/experiments.ts`.

**The look.**
- **Ground:** white by default; dark only when someone picks it (saved under `intact-theme`, applied before first paint by `layout.tsx`).
- **Type:** Geist at 500 for headings and interface, Newsreader for reading text, Geist Mono for facts and data. Six sizes.
- **Colour has one meaning each,** and only inside the data: red is money that went wrong, green is money kept, amber is a person deciding.
- **No cards, shadows or gradients.** Hairlines and space.
- **Copy:** outcomes as paid once or twice, not amounts. No country in the copy; the transcripts keep their real details.
- **Logo mark:** a rounded square with a slot cut in it (`.intact-mark`). Tokens for the home page are under `.note` and `.nx` in `globals.css`.

**Design skills, in this order:** frontend-design for direction, dataviz for charts, emil-design-eng for interactions and motion, then unslop as the final pass. Respect `prefers-reduced-motion`.

## Next jobs on the site

As of 27 November, after the chapters redesign:

1. **All pages share the lab style.** Home sections: opening, 01 Figure 1, 02 one sentence, 03 what we build from it (public wording, dashboard picture), 04 research (`ResearchList`).
2. **Platform section:** public wording only, from `PLATFORM` in `content/how-it-works.ts`.
3. **Platform copy:** say only what the owner has chosen to say in public. Never copy wording from the private repo's plan into this one, not even in a comment.
4. **Design skills** are in `.claude/skills/`: frontend-design (Anthropic, Apache 2.0), emil-design-eng and choreograph (Emil Kowalski, MIT), unslop (CC BY 4.0). Use them in that order, with dataviz for charts.
5. **Dev server note:** Turbopack's Tailwind loader can keep serving old CSS. Restart `next dev` with `.next/dev` removed after CSS edits, and never run `next build` beside a running dev server.
