# Eventwise

An AI-assisted planning assistant for **weddings, engagements, birthdays, baby showers, anniversaries, housewarmings, corporate events and community events**. Give it a date, guest count and budget (₹) and it builds a complete, adaptive plan.

## Features

- **Budget split** per event type that always adds up exactly, with extra weight for the categories you prioritise, plus a donut chart.
- **Budget tracker**: enter what you have spent per category and see what is left or over budget.
- **Timeline** counted back from the event date; it compresses automatically for short-notice events.
- **Vendor checklist** per category with saved progress.
- **Context-aware insights**: per-guest budget check, monsoon, summer, peak wedding season and weekend-premium alerts.
- **Venues near you**: use your location or type an area; links open Google Maps searches for suitable venue types and local vendors.
- **Shopping suggestions**: Amazon.in search links for decor, cake toppers, flowers and more, driven by your event and "specific needs".
- **Ask Eventwise**: a GenAI assistant that answers questions about your plan (savings, risks, next steps, invitation text), plus AI-generated ideas. Both fall back to rule-based answers when AI is unavailable.
- **Past plans**: view, reuse or delete earlier plans (stored in the browser only).
- Copy or print the plan.

## Run it

It is a static site with no runtime dependencies. The root `index.html` is a **single self-contained file** (styles and scripts inlined), so you can:

- open it in a browser straight from disk, or
- upload or preview it anywhere that serves one HTML file, or
- host the repository with GitHub Pages, or
- run `npm start` and visit <http://127.0.0.1:8080>.

The readable source lives in `src/`. After changing it, run `npm run build` to regenerate the root `index.html` (a test fails if it is out of date).

> The AI features use the `window.claude` runtime available when the page is published as a Claude artifact. Elsewhere (for example plain GitHub Pages) they are disabled and the rule-based fallbacks are used instead; everything else works.

## Project structure

```
index.html            GENERATED single-file page (do not edit; run `npm run build`)
scripts/              build.js (creates index.html) and serve.js (dev server)
src/
  index.html          page markup; lists the scripts in load order
  css/styles.css      all styles, grouped by section, light and dark themes
  js/
    namespace.js      creates the single global `Eventwise` namespace
    data/             constants, shared copy, and one file per event type
      events/*.js     budget split, milestones, vendor tasks, ideas, venues, shopping
    lib/              dates, formatting, DOM helpers, safe localStorage
    planner/          pure planning logic (no DOM): validation, budget, timeline,
                      insights, links, plan assembly, saved history
    assistant/        rule-based answers and the optional AI client
    ui/               everything that touches the page: form, history list,
                      one builder per plan section, and app.js (entry point)
tests/
  unit/               one suite per module, run directly in Node
  integration/        the whole page driven in jsdom
  helpers/            loaders shared by the suites
```

Design choices worth knowing:

- **Plain scripts, one namespace.** Each file attaches its public API to `Eventwise` and may only use files listed above it in `src/index.html`. This keeps `index.html` working when opened from disk, where browsers block ES modules.
- **Logic is separate from the DOM.** Everything under `src/js/planner`, `src/js/assistant` and `src/js/lib` (except `dom.js`) never touches `document`, so it is unit-tested in plain Node against the real source files.
- **Data is separate from code.** An event type is one self-contained data file.
- **Small, documented functions.** ESLint enforces limits on complexity, nesting, parameters and function length.

### Adding an event type

1. Copy an existing file in `src/js/data/events/` and edit it (the allocation must add up to 100 and end with `Contingency`; every category needs vendor tasks).
2. Add a `<script>` tag for it in `src/index.html`, with the other event files.
3. Run `npm run build` to regenerate the single-file `index.html`.
4. Run `npm test`. The profile tests check the data for consistency, and everything else (form, plan, tests that loop over all types) picks the new type up automatically.

## Development

```bash
npm install
npm run check        # lint + format check + all tests
```

| Command                 | What it does                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| `npm test`              | Runs unit and integration tests with Node's built-in test runner   |
| `npm run test:coverage` | Same, with a coverage report                                       |
| `npm run lint`          | ESLint (correctness, style and maintainability rules)              |
| `npm run format`        | Formats everything with Prettier (`format:check` only verifies it) |
| `npm run build`         | Regenerates the single-file `index.html` from `src/`               |
| `npm start`             | Serves the project locally                                         |

Requires Node 22 or newer. The tests use [jsdom](https://github.com/jsdom/jsdom) for the page-level flows (form errors, every event type, XSS safety, location, history, spending tracker, assistant fallbacks). GitHub Actions runs the same checks on every push and pull request.

## Design notes

- **Security**: all user input is rendered as text (never HTML), validated for type and range, and AI replies are validated and length-capped. Saved history is re-validated on load. Links use `rel="noopener noreferrer"`. Location is kept in memory only and rounded to about 1 km in map links.
- **Accessibility**: labelled fields with inline errors, skip link, live status messages, keyboard-friendly controls with 44px targets, light and dark themes, reduced-motion support and WCAG AA contrast.
- **Efficiency**: zero runtime dependencies and no network calls at load.

## Limitations

- Budget percentages and per-guest minimums are reasonable estimates, not market data.
- Venue and shopping links are searches, not live listings.
- Past plans live in the browser's local storage on one device.
- The stylesheet uses `light-dark()` and `color-mix()`, so it needs a browser from 2024 or later.

## License

MIT
