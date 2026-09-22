import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');

function setup({ modelContext } = {}) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://example.com/etch-a-sketch/' });
  const { window } = dom;
  const { document } = window;
  if (modelContext) document.modelContext = modelContext;
  const alerts = [];
  window.alert = message => alerts.push(message);
  window.eval(source);
  const grid = document.querySelector('#drawing-grid');
  function hover(pixel) {
    pixel.dispatchEvent(new window.MouseEvent('pointerover', { bubbles: true }));
  }
  function resize(answer) {
    window.prompt = () => answer;
    document.querySelector('#resize-button').click();
  }
  function rainbow() {
    const radio = document.querySelector('[value="rainbow"]');
    radio.checked = true;
    radio.dispatchEvent(new window.Event('change', { bubbles: true }));
  }
  return { window, document, grid, hover, resize, rainbow, alerts };
}

test('starts with 256 JavaScript-created square divs', () => {
  const { grid } = setup();
  assert.equal(grid.children.length, 256);
  assert.ok([...grid.children].every(cell => cell.tagName === 'DIV'));
  assert.match(grid.getAttribute('aria-label'), /16 by 16/);
});

test('hover inks the entered square and leaves neighboring squares blank', () => {
  const { grid, hover } = setup();
  hover(grid.children[3]);
  assert.equal(grid.children[3].style.getPropertyValue('--opacity'), '1');
  assert.equal(grid.children[3].style.getPropertyValue('--ink'), '#000000');
  assert.equal(grid.children[4].style.getPropertyValue('--opacity'), '');
});

test('resizing replaces the old drawing and updates the accessible label', () => {
  const { grid, hover, resize, document } = setup();
  const oldPixel = grid.firstElementChild;
  hover(oldPixel);
  resize('64');
  assert.equal(grid.children.length, 4096);
  assert.equal(oldPixel.isConnected, false);
  assert.equal(grid.firstElementChild.style.getPropertyValue('--opacity'), '');
  assert.equal(document.querySelector('#size-label').textContent, '64 × 64');
  assert.match(grid.getAttribute('aria-label'), /64 by 64/);
});

test('accepts both size boundaries, including 10,000 squares', () => {
  const { grid, resize } = setup();
  resize('1');
  assert.equal(grid.children.length, 1);
  resize('100');
  assert.equal(grid.children.length, 10000);
});

test('cancel and invalid input preserve both the grid and drawing', () => {
  const { grid, resize, hover, alerts } = setup();
  const original = grid.firstElementChild;
  hover(original);
  for (const input of [null, '', ' ', '0', '-1', '101', '3.5', 'hello', '16px', '1e2', 'Infinity']) {
    resize(input);
    assert.equal(grid.firstElementChild, original);
    assert.equal(grid.children.length, 256);
    assert.equal(original.style.getPropertyValue('--opacity'), '1');
  }
  assert.equal(alerts.length, 10);
});

test('progressive black ink reaches exactly full opacity on the tenth pass', () => {
  const { grid, hover, document } = setup();
  document.querySelector('#shading').checked = true;
  const pixel = grid.firstElementChild;
  for (let pass = 1; pass <= 10; pass += 1) {
    hover(pixel);
    assert.equal(Number(pixel.style.getPropertyValue('--opacity')), pass / 10);
  }
  hover(pixel);
  assert.equal(pixel.style.getPropertyValue('--opacity'), '1');
  assert.equal(pixel.style.getPropertyValue('--ink'), '#000000');
});

test('random RGB is generated on each entry, and combines with progressive shading', () => {
  const { grid, hover, rainbow, document, window } = setup();
  rainbow();
  document.querySelector('#shading').checked = true;
  const values = [0, 0.5, 0.999, 0.25, 0.75, 0.125];
  window.Math.random = () => values.shift() ?? 0.5;
  const pixel = grid.firstElementChild;
  hover(pixel);
  assert.equal(pixel.style.getPropertyValue('--ink'), 'rgb(0, 128, 255)');
  assert.equal(pixel.style.getPropertyValue('--opacity'), '0.1');
  hover(pixel);
  assert.equal(pixel.style.getPropertyValue('--ink'), 'rgb(64, 192, 32)');
  for (let pass = 3; pass <= 10; pass += 1) hover(pixel);
  assert.equal(pixel.style.getPropertyValue('--opacity'), '1');
});

test('clearing preserves size and selected drawing controls', () => {
  const { document, grid, hover, resize, rainbow } = setup();
  resize('32');
  rainbow();
  document.querySelector('#shading').checked = true;
  hover(grid.firstElementChild);
  document.querySelector('#clear-button').click();
  assert.equal(grid.children.length, 1024);
  assert.equal(grid.firstElementChild.style.getPropertyValue('--opacity'), '');
  assert.equal(document.querySelector('#shading').checked, true);
  assert.equal(document.querySelector('[value="rainbow"]').checked, true);
});

test('keyboard drawing respects the canvas boundaries', () => {
  const { document, window, grid } = setup();
  const key = key => grid.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  grid.focus();
  key('ArrowLeft');
  key(' ');
  assert.equal(grid.children[0].style.getPropertyValue('--opacity'), '1');
  key('ArrowDown');
  key('ArrowRight');
  key('Enter');
  assert.equal(grid.children[17].style.getPropertyValue('--opacity'), '1');
  assert.match(document.querySelector('#status').textContent, /row 2, column 2/);
});

test('touch dragging inks each newly entered square once per entry', () => {
  const { window, document, grid } = setup();
  document.querySelector('#shading').checked = true;
  let cell = grid.children[0];
  document.elementFromPoint = () => cell;
  function touch(type) {
    const event = new window.MouseEvent(type, { bubbles: true, buttons: 1, clientX: 10, clientY: 10 });
    Object.defineProperty(event, 'pointerType', { value: 'touch' });
    cell.dispatchEvent(event);
  }
  touch('pointerover');
  touch('pointerdown');
  touch('pointermove');
  assert.equal(cell.style.getPropertyValue('--opacity'), '0.1');
  cell = grid.children[1];
  touch('pointermove');
  assert.equal(cell.style.getPropertyValue('--opacity'), '0.1');
  cell = grid.children[0];
  touch('pointermove');
  assert.equal(cell.style.getPropertyValue('--opacity'), '0.2');
});

test('optional canvas tool validates input before changing state', () => {
  let tool;
  const { grid } = setup({ modelContext: { registerTool: value => { tool = value; } } });
  assert.equal(tool.name, 'reset_sketch_canvas');
  assert.equal(tool.annotations.readOnlyHint, false);
  assert.equal(tool.execute({ size: 20 }).squares, 400);
  assert.equal(grid.children.length, 400);
  assert.throws(() => tool.execute({ size: 101 }), /whole number/);
  assert.throws(() => tool.execute({ size: 20, unexpected: true }), /whole number/);
  assert.equal(grid.children.length, 400);
});
