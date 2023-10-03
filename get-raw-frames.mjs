/**
 * Produces stream of VideoFrame-s from the given media stream
 * @param {MediaStream} stream
 * @returns {AsyncGenerator<{displayHeight: number, duration: number, colorSpace: VideoColorSpaceInit, visibleRect: any, codedWidth: number, codedRect: any, displayWidth: number, format: VideoPixelFormat, codedHeight: number, buffer: Uint8Array, timestamp: number}, void, *>}
 */
export async function* getRawFrames(stream) {
    const [track] = stream.getVideoTracks();
    const trackProcessor = new MediaStreamTrackProcessor({ track });
    const reader = trackProcessor.readable.getReader();
    let buffer, frameData;
    while (true) {
        const readValue = await reader.read();
        if (readValue.done) {
            console.log('DONE')
            break;
        }

        const frame = readValue.value;
        if (!frame) continue;

        const allocationSize = frame.allocationSize();
        if (!buffer || buffer.byteLength !== allocationSize) {
            console.log(frame.format, frame.codedWidth, frame.codedHeight, allocationSize, frame.codedRect.toJSON(), frame.visibleRect.toJSON(), frame.colorSpace.toJSON());
            buffer = new Uint8Array(allocationSize);
            frameData = {
                format: frame.format,
                codedWidth: frame.codedWidth,
                codedHeight: frame.codedHeight,
                codedRect: frame.codedRect.toJSON(),
                visibleRect: frame.visibleRect.toJSON(),
                displayWidth: frame.displayWidth,
                displayHeight: frame.displayHeight,
                duration: frame.duration,
                timestamp: frame.timestamp,
                colorSpace: frame.colorSpace.toJSON(),
                buffer,
            };
        }

        frameData.planes = await frame.copyTo(buffer);
        frame.close();

        yield frameData;
    }
}
