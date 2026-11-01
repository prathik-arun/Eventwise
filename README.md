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
It is a single static file with no build step: open `index.html` in a browser, or host it with GitHub Pages.

> The AI features use the `window.claude` runtime available when the page is published as a Claude artifact. Elsewhere (for example plain GitHub Pages) they are disabled and the rule-based fallbacks are used instead; everything else works.

## Tests
```bash
npm install
npm test
```
Uses Node's built-in test runner and jsdom. The planning logic tests live in `tests/logic-tests.js`; UI flow tests (form errors, every event type, XSS safety, location, history, assistant fallback) are in `tests/eventwise.test.js`.

## Design notes
- **Security**: all user input is rendered as text (never HTML), validated for type and range, and AI replies are validated and length-capped. Saved history is re-validated on load. Links use `rel="noopener noreferrer"`. Location is kept in memory only and rounded to about 1 km in map links.
- **Accessibility**: labelled fields with inline errors, skip link, live status messages, keyboard-friendly controls with 44px targets, light and dark themes, reduced-motion support and WCAG AA contrast.
- **Efficiency**: zero dependencies and no network calls at load.

## Limitations
- Budget percentages and per-guest minimums are reasonable estimates, not market data.
- Venue and shopping links are searches, not live listings.
- Past plans live in the browser's local storage on one device.

## License
MIT
