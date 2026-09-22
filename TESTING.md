# Manual browser checks

Automated behavior tests: `npm test`. Production build: `npm run build`.

These manual checks should be run in a normal browser; they are not claimed as completed by the automated test suite.

1. Load the page. Confirm the blank canvas has exactly 16 squares along each side and is square.
2. Move the pointer over multiple cells without holding a button. Confirm the trail persists after leaving them.
3. Choose Random color. Re-enter one cell several times and confirm its RGB color changes.
4. Clear the canvas, choose Black ink, and enable Build up the shade. Enter one cell ten separate times; it should reach black precisely on the tenth. Additional entries should leave it black.
5. Clear and repeat with Random color and shading together. The color should change on every entry and become fully opaque on the tenth.
6. Record the canvas's outer dimensions. Change the grid to 64 and then 100; its dimensions must stay the same at the same viewport, and the previous drawing must disappear.
7. Try 0, 101, -1, 3.5, blank input, text, and Cancel. The sketch must remain intact. Try 1 and confirm it produces one square.
8. Tab through the controls. The focused item should be visible. On the canvas, try arrows and Space/Enter, including the outside edges.
9. On a phone or touchscreen, draw by dragging a finger; moving within the same cell should not repeatedly darken it. Re-entering it should add another pass.
10. Check narrow and wide viewports and 200% zoom. Confirm the controls remain usable and there is no horizontal overflow.
11. Check the console for errors during normal use and after repeated clears and resizes.

## Validation record

- Automated DOM checks: 11 passing.
- Vite production build: passing.
- Visual/mobile browser QA: not yet verified; the development environment's browser could not reach the local preview.
- WebMCP: registered action tested with a simulated API; no supported live browser context was available to verify native registration.
