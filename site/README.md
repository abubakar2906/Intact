# Intact site

The public site for Intact's results. Next.js (App Router), TypeScript and Tailwind.

Every number and transcript on it comes from `../results/`, through `scripts/build-data.ts`, which runs before every `npm run dev` and `npm run build`. The site never stores a figure of its own.

## Run it

Needs Node 22.6 or newer.

```sh
cd site
npm install
npm run dev        # http://localhost:3000
```

## Add an experiment

1. Publish the run from the repo root: `npm run publish -- runs/probe-<time> <short-name>`.
2. Add an entry to the top of `src/content/experiments.ts`: the claim, the setups in story order, the models, the beats and the limits. The claim has to be true of the data: check it against the summary before you write it.
3. Add any new model to `src/content/models.ts`, with its logo in `public/logos/`.
4. `npm run dev` and read the page on a phone-sized window too.

## Deploy

Vercel: import the repo and set the project's root directory to `site`. The build reads `../results`, which Vercel includes by default.

## The look

A bank statement: white paper, black figures, and red only for money that went wrong. The agents' own words are set in Martian Mono, so they read as the machine talking. Tokens are in `src/app/globals.css`.
