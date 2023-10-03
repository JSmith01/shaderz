export function setupDebug(ctx, target) {
    // debug
    target.ctx = ctx;
    target.getCaughtPx = (x, y) => {
        const offset = (x + y * target.caughtData.width) * 4;
        return Array.from(target.caughtData.data.slice(offset, offset + 4));
    };
    target.getCaughtYuv = (x, y) => {
        const buf = target.caught.buffer;
        const uvOffset = target.caught.planes[1].offset + Math.floor(y / 2) * target.caught.planes[1].stride + Math.floor(x/2)
        return [
            buf[x + y * target.caught.planes[0].stride],
            buf[uvOffset],
            buf[uvOffset + 1]
        ];
    };
    target.setYuvPx = (tx, ty, [y, u, v]) => {
        const buf = target.caught.buffer;
        const uvPos = target.caught.planes[1].offset + Math.floor(ty / 2) * target.caught.planes[1].stride + Math.floor(tx / 2);
        buf[tx + ty * target.caught.planes[0].stride] = y;
        buf[uvPos] = u;
        buf[uvPos + 1] = v;
    };

    let catchFrame = false;
    target.catchFrame = () => {
        catchFrame = true;
    };
    target.paintCaught = () => {
        const frame = new VideoFrame(target.caught.buffer, { ...caught, codedHeight: 360, visibleRect: undefined });
        ctx.drawImage(frame, 0,0);
        frame.close();
        target.caughtData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    };

    return function debugHook(frameData) {
        if (catchFrame) {
            target.caught = { ...frameData, buffer: frameData.buffer.slice() };
            catchFrame = false;
        }
    };
}
