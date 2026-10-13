export function paint(canvas, bmp) {
    if (canvas.width !== bmp.width) canvas.width = bmp.width;
    if (canvas.height !== bmp.height) canvas.height = bmp.height;

    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(bmp.width, bmp.height);
    const px = img.data;

    for (let i = 0; i < bmp.data.length; i++) {
        const v = bmp.data[i] ? 255 : 0;
        const o = i * 4;
        px[o] = v;
        px[o + 1] = v;
        px[o + 2] = v;
        px[o + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
}