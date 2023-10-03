precision mediump float;
varying vec2 v_texcoord;

uniform vec2 canvas_dims;
uniform vec2 texture_dims;

uniform sampler2D u_texture;
uniform sampler2D uv_texture;
const float lowYLimit = 16.0;
const float highYLimit = 240.0;
const float shiftY = lowYLimit / 255.0;
const float scaleY = 255.0 / (highYLimit - lowYLimit);

vec3 getRgb(vec2 coord) {
    float y = texture2D(u_texture, coord).x;
    float u = texture2D(uv_texture, vec2(coord.x, coord.y * 0.5 + 0.5)).x - 0.5;
    float v = texture2D(uv_texture, vec2(coord.x, coord.y * 0.5)).x - 0.5;
    // fullrange = false
    y = (y - shiftY) * scaleY;

    // Convert YUV to RGB - BT.709
    // https://gist.github.com/yohhoy/dafa5a47dade85d8b40625261af3776a
    return vec3(
        y + 1.5748 * v,              // R
        y - 0.1873242729306488 * u - 0.46812427293064884 * v, // G
        y + 1.8556 * u              // B
    );
}

// AMD FidelityFX CAS
// Contrast adaptive sharpening
// https://www.shadertoy.com/view/ftsXzM
vec3 getCas(vec2 uv) {
    vec3 col = getRgb(uv);

    // CAS algorithm
    float max_g = col.y;
    float min_g = col.y;
    vec4 uvoff = vec4(1,0,1,-1) / texture_dims.xxyy;
    vec3 colw;

    // up
    vec3 col1 = getRgb(uv + uvoff.yw);
    max_g = max(max_g, col1.y);
    min_g = min(min_g, col1.y);
    colw = col1;

    // right
    col1 = getRgb(uv+uvoff.xy);
    max_g = max(max_g, col1.y);
    min_g = min(min_g, col1.y);
    colw += col1;

    // down
    col1 = getRgb(uv+uvoff.yz);
    max_g = max(max_g, col1.y);
    min_g = min(min_g, col1.y);
    colw += col1;

    // left
    col1 = getRgb(uv-uvoff.xy);
    max_g = max(max_g, col1.y);
    min_g = min(min_g, col1.y);
    colw += col1;

    float d_min_g = min_g;
    float d_max_g = 1.-max_g;

    float A;
    if (d_max_g < d_min_g) {
        A = d_max_g / max_g;
    } else {
        A = d_min_g / max_g;
    }
    // sharpness coefficient should be in [-.125, -.2]
    A = sqrt(A) * -.16;

    vec3 col_out = (col + colw * A) / (1. + 4. * A);

    return col_out;
}

void main() {
    gl_FragColor = vec4(getCas(v_texcoord), 1.0);
    //gl_FragColor = vec4(getRgb(v_texcoord), 1.0);
}
