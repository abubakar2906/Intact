# Which models to test, and why

Checked on 27 November 2026, before the third run, so the choice rests on what people use, not on taste.

## The source

OpenRouter's public rankings (openrouter.ai/rankings) include **tool calls per model, per week**. A tool call is a model asking to use a tool, which is what an agent does. It is the closest public measure of which models people run as agents. It counts calls only: nobody's prompts or data are read.

The raw weekly numbers, as the page served them, are saved in `docs/data/openrouter-tool-calls-2026-11-27.json`.

## Share of tool calls, 2 to 26 November 2026

Four weeks combined (the last week was still in progress).

| Share | Model | Lab |
|---|---|---|
| 31.7% | DeepSeek V4.1 Flash (two versions) | DeepSeek |
| 15.9% | Hy4 Flash and Hy4 | Tencent |
| 10.5% | GLM 5.3 Flash | Z.ai |
| 5.4% | GPT-6 Luna | OpenAI |
| 2.0% | Claude Haiku 5.5 | Anthropic |
| 1.3% | Claude Opus 5.5 | Anthropic |
| 1.1% | GLM 5.3 | Z.ai |
| 1.1% | GPT-6.1 Sol | OpenAI |
| 29.4% | Everything else | |

## What it shows

- **Agents run on cheap, fast models.** The top four by tool calls are each lab's fast tier. The flagships most people would name barely appear.
- **GLM 5.3 Flash, already in the first experiment, is the third most-used model for tool calls.** The first experiment tested a model people really use.
- **No Gemini model is in the top list.**
- **Opus is the only flagship that shows up**, and it is a real share, not a rounding error.

## The limit of this source

OpenRouter only sees OpenRouter's traffic. Teams that call OpenAI or Anthropic directly don't appear, and they are probably the bigger share of those two labs' agent traffic. So OpenRouter overstates cheap open models. That is why the rule below takes the top model **from each lab**, instead of the raw top list, which would be almost all one kind of model.

## The rule

> The most-used model for tool calls on OpenRouter from each of the top five labs by tool calls, over 2 to 26 November 2026. Plus Claude Opus 5.5 as the ceiling: the best model a team could pay for.

That gives:

| Role | Model |
|---|---|
| Workhorse | DeepSeek V4.1 Flash |
| Workhorse | Tencent Hy4 Flash |
| Workhorse | GLM 5.3 Flash (already tested in the first experiment) |
| Workhorse | OpenAI GPT-6 Luna |
| Workhorse | Claude Haiku 5.5 |
| Ceiling | Claude Opus 5.5 |
