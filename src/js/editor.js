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

const ZOOM = 4;

const state = {
    screenId: screens[0].id,
    boardId: 'uno',
    bitmaps: {},
};

function activeScreen () {
    return screens.find(s=>s.id===state.screenId);
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

function render() {
    const s = activeScreen();
    const bmp = activeBitmap();
    const pins = pinoutFor(state.boardId);
    const board = boards[state.boardId];

    canvas.style.width = s.width * ZOOM + 'px';
    canvas.style.height = s.height * ZOOM + 'px';

    screenName.textContent = s.label;
    paint(canvas, bmp);

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
    closePicker();
    scheduleSave();
}

function openPicker() {
    screenList.innerHTML = '';
    for ( const s of screens) {
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

pencil.addEventListener('click',openPicker);

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

function plotLine(bmp,x0,y0,x1,y1,value) {
    const dx = Math.abs(x1-x0);
    const dy = -Math.abs(y1-y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    while (true) {
        setPixel(bmp,x0,y0,value);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) {err += dy; x0 += sx;}
        if (e2 <= dx) {err += dx; y0 += sy;}
    }
}

canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drawing = true;
    canvas.setPointerCapture(e.pointerId);

    const {x,y} = toGrid(e);
    const bmp = activeBitmap();

    drawValue = getPixel(bmp,x,y) ? 0:1;
    setPixel(bmp,x,y,drawValue);
    lastX = x;
    lastY = y;
    paint(canvas,bmp);
});

canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const {x,y} = toGrid(e);
    if (x=== lastX && y=== lastY) return;

    const bmp = activeBitmap();
    plotLine(bmp,lastX,lastY,x,y,drawValue);
    lastX = x;
    lastY = y;
    paint(canvas,bmp);
});

canvas.addEventListener('pointerup', (e) => {
    drawing = false;
    canvas.releasePointerCapture(e.pointerId);
    scheduleSave();
});

clearBtn.addEventListener('click', () => {
    const bmp = activeBitmap();
    clearBitmap(bmp);
    paint(canvas, bmp);
    scheduleSave();
});

fillBtn.addEventListener('click', () =>{
    const bmp = activeBitmap();
    bmp.data.fill(1);
    paint(canvas,bmp);
    scheduleSave();
});

invertBtn.addEventListener('click', () => {
    const bmp = activeBitmap();
    for (let i = 0; i < bmp.data.length; i++) {
        bmp.data[i] = bmp.data[i] ? 0: 1;
    }

    paint(canvas,bmp);
    scheduleSave();
});

restore();
render();