const grid = document.querySelector('#drawing-grid');
const sizeLabel = document.querySelector('#size-label');
const canvasCount = document.querySelector('#canvas-count');
const status = document.querySelector('#status');
const shadingCheckbox = document.querySelector('#shading');
const MIN_SIZE = 1;
const MAX_SIZE = 100;
let size = 16;
let ink = 'black';
let activeIndex = 0;
let lastTouchCell = null;

// Create every square in JavaScript. Flexbox handles the rows and columns.
function createGrid(nextSize) {
  size = nextSize;
  activeIndex = 0;
  lastTouchCell = null;
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < size * size; index += 1) {
    const pixel = document.createElement('div');
    pixel.className = 'pixel';
    pixel.dataset.passes = '0';
    fragment.append(pixel);
  }

  grid.style.setProperty('--grid-size', size);
  grid.replaceChildren(fragment);
  grid.setAttribute('aria-label', `Drawing canvas, ${size} by ${size} squares`);
  sizeLabel.textContent = `${size} × ${size}`;
  canvasCount.textContent = `${(size * size).toLocaleString()} little possibilities`;
  status.textContent = `Fresh ${size} by ${size} canvas. ${size * size} squares ready.`;
}

function randomColor() {
  const channel = () => Math.floor(Math.random() * 256);
  return `rgb(${channel()}, ${channel()}, ${channel()})`;
}

function paint(pixel) {
  if (!pixel || !pixel.classList.contains('pixel')) return;
  const passes = Math.min(10, Number(pixel.dataset.passes) + 1);
  pixel.dataset.passes = String(passes);
  pixel.style.setProperty('--ink', ink === 'rainbow' ? randomColor() : '#000000');
  // A separate ink layer keeps the white background and grid lines opaque.
  pixel.style.setProperty('--opacity', shadingCheckbox.checked ? passes / 10 : 1);
}

function requestGridSize() {
  const answer = window.prompt('How many squares per side? Enter a whole number from 1 to 100. This will clear your sketch.', String(size));
  if (answer === null) return;
  const trimmed = answer.trim();
  const requestedSize = Number(trimmed);

  if (!/^\d+$/.test(trimmed) || !Number.isInteger(requestedSize) || requestedSize < MIN_SIZE || requestedSize > MAX_SIZE) {
    window.alert('Please enter a whole number from 1 to 100. Your current sketch has been kept.');
    return;
  }

  createGrid(requestedSize);
}

// Event delegation keeps even a 100 × 100 canvas to one hover listener.
grid.addEventListener('pointerover', (event) => {
  if (event.pointerType === 'touch') return;
  if (event.target !== event.relatedTarget) paint(event.target);
});

// Touch pointers implicitly capture their starting element. Hit-testing finds
// the actual square under the finger as it moves instead of repainting that one.
function paintTouchPosition(event) {
  const pixel = document.elementFromPoint(event.clientX, event.clientY);
  if (pixel && grid.contains(pixel) && pixel.classList.contains('pixel')) {
    if (pixel !== lastTouchCell) paint(pixel);
    lastTouchCell = pixel;
  } else {
    lastTouchCell = null;
  }
}

grid.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch') return;
  lastTouchCell = null;
  paintTouchPosition(event);
});
grid.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch' && event.buttons !== 0) paintTouchPosition(event);
});
grid.addEventListener('pointerup', () => { lastTouchCell = null; });
grid.addEventListener('pointercancel', () => { lastTouchCell = null; });

grid.addEventListener('keydown', (event) => {
  const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -size, ArrowDown: size };
  if (!(event.key in moves) && event.key !== ' ' && event.key !== 'Enter') return;
  event.preventDefault();
  grid.children[activeIndex].classList.remove('keyboard-active');
  if (event.key in moves) {
    const column = activeIndex % size;
    const crossesEdge = (event.key === 'ArrowLeft' && column === 0) || (event.key === 'ArrowRight' && column === size - 1);
    if (!crossesEdge) activeIndex = Math.max(0, Math.min(size * size - 1, activeIndex + moves[event.key]));
  } else {
    paint(grid.children[activeIndex]);
    const passes = grid.children[activeIndex].dataset.passes;
    status.textContent = `Inked row ${Math.floor(activeIndex / size) + 1}, column ${activeIndex % size + 1}. ${shadingCheckbox.checked ? `${passes} of 10 passes.` : ''}`;
  }
  grid.children[activeIndex].classList.add('keyboard-active');
});
grid.addEventListener('focus', () => { grid.children[activeIndex].classList.add('keyboard-active'); });
grid.addEventListener('blur', () => { grid.children[activeIndex].classList.remove('keyboard-active'); });

document.querySelectorAll('input[name="ink"]').forEach((input) => {
  input.addEventListener('change', () => {
    ink = input.value;
    status.textContent = ink === 'black' ? 'Black ink selected.' : 'Random colors selected.';
  });
});
document.querySelector('#resize-button').addEventListener('click', requestGridSize);
document.querySelector('#clear-button').addEventListener('click', () => createGrid(size));
shadingCheckbox.addEventListener('change', () => {
  status.textContent = shadingCheckbox.checked ? 'Progressive shading on. Ten passes fully ink a fresh square.' : 'Progressive shading off.';
});

createGrid(size);

// Optional progressive enhancement: browsers without WebMCP ignore this.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'reset_sketch_canvas',
      title: 'Start a fresh sketch',
      description: 'Clear the existing drawing and create a fresh square canvas. This removes every inked square.',
      inputSchema: {
        type: 'object',
        properties: { size: { type: 'integer', minimum: MIN_SIZE, maximum: MAX_SIZE } },
        required: ['size'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || Object.keys(input).some(key => key !== 'size') || !Number.isInteger(input.size) || input.size < MIN_SIZE || input.size > MAX_SIZE) {
          throw new Error('Size must be a whole number from 1 to 100.');
        }
        createGrid(input.size);
        return { size, squares: size * size, cleared: true };
      },
    }, { signal: lifecycle.signal })).catch(() => {});
  } catch {
    // The drawing app does not depend on optional browser integrations.
  }
}
