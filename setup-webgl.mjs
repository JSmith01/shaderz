function prepareShader(gl, vs, fs) {
    const shaderProgram = gl.createProgram();

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vs);
    gl.compileShader(vertexShader);
    let message = gl.getShaderInfoLog(vertexShader);
    if (message.length > 0) throw message;
    gl.attachShader(shaderProgram, vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fs);
    gl.compileShader(fragmentShader);
    message = gl.getShaderInfoLog(fragmentShader);
    if (message.length > 0) throw message;
    gl.attachShader(shaderProgram, fragmentShader);

    gl.linkProgram(shaderProgram);

    return shaderProgram;
}

export function initWebGl(gl, vs, fs) {
    const shaderProgram = prepareShader(gl, vs, fs);

    gl.useProgram(shaderProgram);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Set the texture uniform in the shader
    const textureLocation = gl.getUniformLocation(shaderProgram, 'u_texture');
    gl.uniform1i(textureLocation, 0);

    gl.activeTexture(gl.TEXTURE1);
    const texture_uv = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture_uv);
    const textureLocation2 = gl.getUniformLocation(shaderProgram, 'uv_texture');
    gl.uniform1i(textureLocation2, 1);

    const canvasDimsLoc = gl.getUniformLocation(shaderProgram, 'canvas_dims');
    const textureDimsLoc = gl.getUniformLocation(shaderProgram, 'texture_dims');

    return function drawGl(width, height, view_y, view_uv, separate_uv = false) {
        gl.uniform2f(canvasDimsLoc, gl.canvas.width, gl.canvas.height);
        gl.uniform2f(textureDimsLoc, width, height);

        // Y component
        gl.activeTexture(gl.TEXTURE0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0 , gl.LUMINANCE, gl.UNSIGNED_BYTE, view_y);
        gl.generateMipmap(gl.TEXTURE_2D);

        // UV component
        gl.activeTexture(gl.TEXTURE1);
        if (separate_uv) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width / 2, height, 0 , gl.LUMINANCE, gl.UNSIGNED_BYTE, view_uv);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, width / 2, height / 2, 0 , gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, view_uv);
        }
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
}
