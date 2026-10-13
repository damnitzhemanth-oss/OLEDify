export function createBitmap(width,height) {
    return {
        width,
        height,
        data: new Uint8Array(width*height),
    };
}

export function getPixel(bmp,x,y) {
    if (x<0 || y<0 || x >= bmp.width || y>= bmp.height) return 0;
    return bmp.data[y*bmp.width + x];
}

export function setPixel(bmp,x,y,value) {
    if (x<0 || y<0 || x >= bmp.width || y >= bmp.height) return;
    bmp.data[y*bmp.width + x] = value ? 1: 0;
}

export function clearBitmap(bmp) {
    bmp.data.fill(0);
}

