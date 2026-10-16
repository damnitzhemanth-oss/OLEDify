import { initThemeToggle } from "./theme.js";
import {createBitmap,getPixel,setPixel,clearBitmap} from './bitmap.js';
import {paint} from './render.js';
import {screens} from './screens.js';
import * as storage from './storage.js';
import { pinoutFor, boards } from './pins.js';
import { renderWires } from './wires.js';

initThemeToggle();

const canvas = document.getElementById('screen');
const screenName = document.getElementById('screenName');
const pencil = document.getElementById('pencil');
const screenPicker = document.getElementById('screenPicker');
const screenList = document.getElementById('screenList');
const clearBtn = document.getElementById('clearBtn');
const fillBtn = document.getElementById('fillBtn');
const invertBtn = document.getElementById('invertBtn');
const gridBtn = document.getElementById('gridBtn');
const fontBtn = document.getElementById('fontBtn');
const gridOverlay = document.getElementById('gridOverlay');
const workspace =  document.querySelector('.workspace');
const leftPanelEl = document.getElementById('leftPanelEl');
const rightPanelEl = document.getElementById('rightPanelEl');
const canvasToggle = document.getElementById('canvasToggle');
const setupToggle = document.getElementById('setupToggle');
const topbarRight = document.getElementById('topbarRight');
const hamburger = document.getElementById('hamburger');


const BASE_SCALE = 4;

const stage = document.getElementById('stage');
const world = document.getElementById('world');
const screenWrap = document.querySelector('.screen-wrap');
const gridSvg = document.getElementById('gridSvg');
const fitBtn = document.getElementById('fitBtn');

const state = {
    screenId: screens[0].id,
    boardId: 'uno',
    bitmaps: {},
    grid: false,
    font: 'mono',
};

const view = {
    zoom: 1,
    panX: 0,
    panY: 0,
};

function applyView() {
    world.style.transform = `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`;
    world.style.setProperty('--inv-zoom', 1 / view.zoom);
}

function fitView() {
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const ww = screenWrap.offsetWidth;
    const wh = screenWrap.offsetHeight;
    if (!ww || !wh) return;

    const pad = 60;
    const z = Math.min((sw - pad) / ww, (sh - pad) / wh);
    view.zoom = Math.max(0.15, Math.min(4, z));
    view.panX = (sw - ww * view.zoom) / 2;
    view.panY = (sh - wh * view.zoom) / 2;
    applyView();
}

const ui = {
    leftOpen: true,
    rightOpen: true,
};

function applyUI() {
    workspace.classList.toggle('left-hidden', !ui.leftOpen);
    workspace.classList.toggle('right-hidden', !ui.rightOpen);
    canvasToggle.classList.toggle('active', ui.leftOpen);
    setupToggle.classList.toggle('active', ui.rightOpen);
}

function toggleCanvas() {
    ui.leftOpen = !ui.leftOpen;
    applyUI();
}

function toggleSetup() {
    ui.rightOpen = !ui.rightOpen;
    applyUI();
}

canvasToggle.addEventListener('click', toggleCanvas);
setupToggle.addEventListener('click', toggleSetup);
document.getElementById('leftClose').addEventListener('click', toggleCanvas);
document.getElementById('rightClose').addEventListener('click', toggleSetup);

applyUI();

function activeScreen() {
    return screens.find(s => s.id === state.screenId);
}

function activeBitmap() {
    const s = activeScreen();
    if (!state.bitmaps[s.id]) {
        state.bitmaps[s.id] = createBitmap(s.width, s.height);
    }
    return state.bitmaps[s.id];
}

function restore() {
    const saved = storage.load();
    if (!saved) return;

    if (screens.some(s => s.id === saved.screenId)) {
        state.screenId = saved.screenId;
    }

    for (const s of screens) {
        const raw = saved.bitmaps && saved.bitmaps[s.id];
        if (!Array.isArray(raw)) continue;
        if (raw.length !== s.width * s.height) continue;
        const bmp = createBitmap(s.width, s.height);
        bmp.data.set(raw);
        state.bitmaps[s.id] = bmp;
    }
}

let saveTimer = null;

function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 400);
}

function persist() {
    const payload = { screenId: state.screenId, bitmaps: {} };
    for (const id in state.bitmaps) {
        payload.bitmaps[id] = Array.from(state.bitmaps[id].data);
    }
    storage.save(payload);
}

function buildGrid(bmp) {
    let lines = '';
    for (let x = 0; x <= bmp.width; x++) {
        lines += `<line x1="${x}" y1="0" x2="${x}" y2="${bmp.height}"/>`;
    }
    for (let y = 0; y <= bmp.height; y++) {
        lines += `<line x1="0" y1="${y}" x2="${bmp.width}" y2="${y}"/>`;
    }
    gridSvg.setAttribute('viewBox', `0 0 ${bmp.width} ${bmp.height}`);
   gridSvg.setAttribute('shape-rendering', 'crispEdges');
    gridSvg.innerHTML = lines;
}

function render() {
    const s = activeScreen();
    const bmp = activeBitmap();
    const pins = pinoutFor(state.boardId);
    const board = boards[state.boardId];

    canvas.style.width = s.width * BASE_SCALE + 'px';
    canvas.style.height = s.height * BASE_SCALE + 'px';

    screenName.textContent = s.label;
    paint(canvas, bmp);
    buildGrid(bmp);

    renderWires(document.getElementById('wires'), pins);

    document.getElementById('boardName').textContent = board.label;
    document.getElementById('displayName').textContent = s.label;
    document.getElementById('displayBus').textContent = `I2C · ${pins.length} wires`;

    const list = document.getElementById('pinList');
    list.innerHTML = '';
    for (const pin of pins) {
        const row = document.createElement('div');
        row.className = 'pin-row';
        row.innerHTML =
            `<span class="pin-dot pin-${pin.id}"></span>` +
            `<span>${pin.label}</span>` +
            `<span class="pin-arrow">→</span>` +
            `<span class="pin-target">${pin.target}</span>`;
        list.appendChild(row);
    }
}

function setScreen(id) {
    state.screenId = id;
    render();
    requestAnimationFrame(fitView);
    closePicker();
    scheduleSave();
}

function openPicker() {
    screenList.innerHTML = '';
    for (const s of screens) {
        const btn = document.createElement('button');
        btn.className = 'screen-option';
        btn.textContent = s.label;
        if (s.id === state.screenId) btn.classList.add('active');
        btn.addEventListener('click', () => setScreen(s.id));
        screenList.appendChild(btn);
    }
    screenPicker.classList.add('open');
}

function closePicker() {
    screenPicker.classList.remove('open');
}

pencil.addEventListener('click', openPicker);

screenPicker.addEventListener('click', (e) => {
    if (e.target === screenPicker) closePicker();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePicker();
});


let drawing = false;
let drawValue = 1;
let lastX = -1;
let lastY = -1;

function toGrid(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: Math.floor((e.clientX - rect.left) / rect.width * canvas.width),
        y: Math.floor((e.clientY - rect.top) / rect.height * canvas.height),
    };
}

function plotLine(bmp, x0, y0, x1, y1, value) {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    while (true) {
        setPixel(bmp, x0, y0, value);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
}



canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.altKey) return;
    drawing = true;
    canvas.setPointerCapture(e.pointerId);

    const { x, y } = toGrid(e);
    const bmp = activeBitmap();

    drawValue = getPixel(bmp, x, y) ? 0 : 1;
    setPixel(bmp, x, y, drawValue);
    lastX = x;
    lastY = y;
    paint(canvas, bmp);
});

canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const { x, y } = toGrid(e);
    if (x === lastX && y === lastY) return;

    const bmp = activeBitmap();
    plotLine(bmp, lastX, lastY, x, y, drawValue);
    lastX = x;
    lastY = y;
    paint(canvas, bmp);
});

canvas.addEventListener('pointerup', (e) => {
    drawing = false;
    canvas.releasePointerCapture(e.pointerId);
    scheduleSave();
});

canvas.addEventListener('pointercancel', () => {
    drawing = false;
    scheduleSave();
});


stage.addEventListener('wheel', (e) => {
    e.preventDefault();

    const rect = stage.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const next = Math.max(0.15, Math.min(20, view.zoom * factor));

    const wx = (mx - view.panX) / view.zoom;
    const wy = (my - view.panY) / view.zoom;

    view.zoom = next;
    view.panX = mx - wx * next;
    view.panY = my - wy * next;
    applyView();
}, { passive: false });

let panning = false;
let panStartX = 0;
let panStartY = 0;
let panOriginX = 0;
let panOriginY = 0;

stage.addEventListener('pointerdown', (e) => {
    const isMiddle = e.button === 1;
    const isAltLeft = e.button === 0 && e.altKey;
    if (!isMiddle && !isAltLeft) return;

    e.preventDefault();
    panning = true;
    stage.setPointerCapture(e.pointerId);
    panStartX = e.clientX;
    panStartY = e.clientY;
    panOriginX = view.panX;
    panOriginY = view.panY;
});

stage.addEventListener('pointermove', (e) => {
    if (!panning) return;
    view.panX = panOriginX + (e.clientX - panStartX);
    view.panY = panOriginY + (e.clientY - panStartY);
    applyView();
});

stage.addEventListener('pointerup', (e) => {
    if (!panning) return;
    panning = false;
    stage.releasePointerCapture(e.pointerId);
});

stage.addEventListener('dblclick', (e) => {
    stage.addEventListener('dblclick', fitView);
});


clearBtn.addEventListener('click', () => {
    const bmp = activeBitmap();
    clearBitmap(bmp);
    paint(canvas, bmp);
    scheduleSave();
});

fillBtn.addEventListener('click', () => {
    const bmp = activeBitmap();
    bmp.data.fill(1);
    paint(canvas, bmp);
    scheduleSave();
});

invertBtn.addEventListener('click', () => {
    const bmp = activeBitmap();
    for (let i = 0; i < bmp.data.length; i++) {
        bmp.data[i] = bmp.data[i] ? 0 : 1;
    }
    paint(canvas, bmp);
    scheduleSave();
});

state.grid = localStorage.getItem('oledify-grid') === '1';
gridBtn.textContent = state.grid ? 'Grid on' : 'Grid off';
gridOverlay.classList.toggle('on', state.grid);

gridBtn.addEventListener('click', () => {
    state.grid = !state.grid;
    gridBtn.textContent = state.grid ? 'Grid on' : 'Grid off';
    gridOverlay.classList.toggle('on', state.grid);
    localStorage.setItem('oledify-grid', state.grid ? '1' : '0');
});

function applyFont(font) {
    state.font = font;
    document.documentElement.dataset.font = font === 'pixel' ? 'pixel' : '';
    fontBtn.textContent = font === 'pixel' ? 'F*' : 'F';
    localStorage.setItem('oledify-font', font);
}

applyFont(localStorage.getItem('oledify-font') || 'mono');

fontBtn.addEventListener('click', () => {
    applyFont(state.font === 'mono' ? 'pixel' : 'mono');
});

fitBtn.addEventListener('click', fitView);

hamburger.addEventListener('click', () => {
    topbarRight.classList.toggle('menu-open');
});

document.addEventListener('click', (e) => {
    if (!topbarRight.classList.contains('menu-open')) return;
    if (topbarRight.contains(e.target)) return;
    topbarRight.classList.remove('menu-open');
});

document.querySelectorAll('.button-cluster button').forEach(btn => {
    btn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            topbarRight.classList.remove('menu-open');
        }
    });
});


restore();
render();
requestAnimationFrame(fitView);

window.addEventListener('resize', () => {
    if (!stage.clientWidth || !stage.clientHeight) return;
    fitView();
});