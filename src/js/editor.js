import { initThemeToggle } from "./theme.js";
import { createBitmap, getPixel, setPixel} from './bitmap.js';
import {paint} from './render.js'

initThemeToggle();

const canvas = document.getElementById('screen');
const bitmap = createBitmap(128,64);

paint(canvas, bitmap);

let drawing = false;
let drawValue = 1;

function toGrid(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX-rect.left)/rect.width*bitmap.width);
    const y = Math.floor((e.clientY - rect.top)/rect.height*bitmap.height);
    return {x,y};
}

canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 ) return;
    drawing = true;
    canvas.setPointerCapture(e.pointerId);

    const {x,y} = toGrid(e);
    drawValue = getPixel(bitmap,x,y) ? 0: 1;
    setPixel(bitmap,x,y,drawValue);
    paint(canvas,bitmap);
});

canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const {x,y} = toGrid(e);
    setPixel(bitmap,x,y,drawValue);
    paint(canvas,bitmap);
});

canvas.addEventListener('pointerup', (e) => {
    drawing = false;
    canvas.releasePointerCapture(e.pointerId);
});

canvas.addEventListener('pointercancel', () => {
    drawing=false;
});