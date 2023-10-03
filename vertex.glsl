attribute vec2 a_position;
varying vec2 v_texcoord;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texcoord = (a_position + 1.0) / 2.0 * vec2(1, -1);
}
