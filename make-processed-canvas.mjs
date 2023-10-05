import { initWebGl } from './setup-webgl.mjs';
import { getRawFrames } from './get-raw-frames.mjs';

const loadShaders = () => Promise.all([
    fetch('vertex.glsl').then(r => r.text()),
    fetch('easu.glsl').then(r => r.text()),
    fetch('cas.glsl').then(r => r.text()),
]);



export async function makePostprocessedCanvas(stream, width, height, signal) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, colorSpace: 'srgb' });

    if (!gl) throw new Error('WebGL2 is not supported');

    const [vs, fs, fs2] = await loadShaders();
    const drawGl = initWebGl(gl, vs, fs, fs2);

    let bufferSize = 0, format = '', view_y, view_uv;
    (async function updateLoop() {
        for await (const frameData of getRawFrames(stream)) {
            if (signal?.aborted) break;

            if (bufferSize !== frameData.buffer.byteLength || format !== frameData.format) {
                bufferSize = frameData.buffer.byteLength;
                format = frameData.format;
                if (frameData.format !== 'I420') {
                    alert(`Only I420 frames are supported but got ${format}!`);
                    throw new Error('Invalid frame format');
                }
                view_y = new Uint8Array(frameData.buffer.buffer, 0, frameData.planes[1].offset);
                view_uv = new Uint8Array(frameData.buffer.buffer, frameData.planes[1].offset);
            }

            drawGl(frameData.visibleRect.width, frameData.visibleRect.height, view_y, view_uv, true);
        }
    })();

    return canvas;
}
