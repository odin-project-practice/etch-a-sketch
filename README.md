# Etch-a-Sketch

A browser sketchpad built with plain HTML, CSS, and JavaScript for [The Odin Project's Etch-a-Sketch assignment](https://www.theodinproject.com/lessons/foundations-etch-a-sketch). The drawing surface uses **Flexbox**, and every square is created in JavaScript.

## Use the sketchpad

- Move your mouse over a square to leave a mark. No mouse button is required.
- Select **Black ink** or **Random color**. Random mode generates new RGB values on every entry into a square.
- Enable **Build up the shade** for 10% opacity increments. A fresh square becomes fully black, or fully colored in random mode, on its tenth interaction. Opacity stays capped at 100%.
- Use **Change grid** to enter a whole number from 1 to 100. A valid entry replaces the canvas while preserving its total dimensions at the current viewport. Canceling or entering invalid input preserves the current drawing.
- Use **Clear the canvas** to start over without changing the size or selected controls.
- On a touchscreen, drag a finger across the canvas.
- With a keyboard, Tab to the canvas, move with the arrow keys, and use Space or Enter to ink a square.

Changing ink or shading affects subsequent interactions. Each square keeps its pass count until the canvas is cleared or resized. Drawings are temporary and reset when the page reloads.

## Run locally

Install Node.js 22.12 or later, then run:

```sh
npm ci
npm run dev
```

Open the address printed by Vite. Vite is development tooling; the application itself uses no frontend framework or runtime dependencies.

```sh
npm test          # Automated DOM behavior checks
npm run build    # Create the deployable dist/ directory
npm run preview  # Serve that production build locally
```

## Assignment coverage

| Requirement | Implementation |
| --- | --- |
| Initial 16 × 16 grid | 256 square divs created by JavaScript at startup |
| Container element | `#drawing-grid` in `index.html` |
| Flexbox, not CSS Grid | Wrapping Flexbox with percentage-sized squares |
| Persistent hover trail | Delegated pointer events update each square's ink layer |
| Grid-size popup | Native `prompt`, accepting whole numbers from 1–100 |
| Replace rather than append | `replaceChildren` removes the old squares |
| Same overall canvas space | Canvas width and aspect ratio do not depend on resolution |
| Random RGB extra credit | Each interaction samples all three RGB channels |
| Progressive shading extra credit | 10% per interaction, reaching full opacity on pass ten |
| Both extra-credit behaviors together | Random ink and progressive opacity can be enabled together |

Borders are represented by inset shadows, so grid lines do not alter square dimensions. A single delegated hover listener handles even the 10,000-square maximum.

## Files

- `index.html`: page structure, controls, canvas container, and accessibility labels.
- `styles.css`: responsive presentation, Flexbox canvas, and ink layers.
- `script.js`: grid generation, validation, drawing, touch, and keyboard behavior.
- `tests/sketch.test.js`: automated tests using Node's test runner and jsdom.
- `vite.config.js`: relative production asset URLs and development-server configuration.
- `.github/workflows/ci.yml`: runs tests and builds on pushes and pull requests.
- `.openai/hosting.json`: configuration for the companion hosted preview.

Browsers that expose the optional WebMCP API can also reset the canvas through a validated `reset_sketch_canvas` action. Unsupported browsers use the same visible controls normally.

## GitHub Pages

The root HTML, stylesheet, and JavaScript can be served directly; they do not require a build step on GitHub Pages. In the repository's **Settings → Pages**, select **Deploy from a branch**, then **main** and **/(root)**. The `.nojekyll` file disables Jekyll processing. Alternatively, publish the output from `npm run build` with a static host.

## Verification

`npm test` covers grid creation, hover drawing, resizing and replacement, minimum/maximum size, canceled and invalid input, exact ten-pass shading, RGB changes, combined modes, clearing, keyboard boundaries, touch hit-testing, and input validation for the optional canvas tool.

The tests use a simulated DOM. They do not establish visual layout correctness or replace checking actual mouse and touch interaction in a browser. Suggested manual checks are listed in [TESTING.md](./TESTING.md).

## Credits

Assignment: The Odin Project. Implementation, styling, and tests were created with OpenAI Codex at Griffin Tubridy's request. Typography uses DM Sans and Space Grotesk through Google Fonts, with local fallback fonts if unavailable.
