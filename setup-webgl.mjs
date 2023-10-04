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

function createTexture(gl, texN, w, h) {
    gl.activeTexture(gl.TEXTURE0 + texN);
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return targetTexture;
}

function setupTexture(gl, texture, n = 0) {
    gl.activeTexture(gl.TEXTURE0 + n);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function bindFramebufferAndSetViewport(gl, fb, tex, width, height) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    if (tex) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    }
    gl.viewport(0, 0, width, height);
}

export function initWebGl(gl, vs, fs, fs2) {
    const shaderProgram = prepareShader(gl, vs, fs);
    const shaderProgram2 = prepareShader(gl, vs, fs2);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.useProgram(shaderProgram);

    const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    const textureLocation = gl.getUniformLocation(shaderProgram, 'u_texture');
    const textureUvLocation = gl.getUniformLocation(shaderProgram, 'uv_texture');
    const canvasDimsLoc = gl.getUniformLocation(shaderProgram, 'canvas_dims');
    const textureDimsLoc = gl.getUniformLocation(shaderProgram, 'texture_dims');

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    const texture_uv = gl.createTexture();

    const fb = gl.createFramebuffer();
    const fbTexWidth = gl.canvas.width;
    const fbTexHeight = gl.canvas.height;
    const fbTex = createTexture(gl, 3, fbTexWidth, fbTexHeight);

    const iTextureLoc = gl.getUniformLocation(shaderProgram2, 'i_texture');
    const positionLocation2 = gl.getAttribLocation(shaderProgram2, 'a_position');
    gl.enableVertexAttribArray(positionLocation2);
    gl.vertexAttribPointer(positionLocation2, 2, gl.FLOAT, false, 0, 0);

    const canvasDimsLoc2 = gl.getUniformLocation(shaderProgram2, 'canvas_dims');
    const textureDimsLoc2 = gl.getUniformLocation(shaderProgram2, 'texture_dims');

    return function drawGl(width, height, view_y, view_uv, separate_uv = false) {
        gl.useProgram(shaderProgram);

        gl.uniform2f(canvasDimsLoc, fbTexWidth, fbTexHeight);
        gl.uniform2f(textureDimsLoc, width, height);

        // Y component
        setupTexture(gl, texture, 0);
        gl.uniform1i(textureLocation, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0 , gl.LUMINANCE, gl.UNSIGNED_BYTE, view_y);

        // UV component
        setupTexture(gl, texture_uv, 1);
        gl.uniform1i(textureUvLocation, 1);
        if (separate_uv) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width / 2, height, 0 , gl.LUMINANCE, gl.UNSIGNED_BYTE, view_uv);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, width / 2, height / 2, 0 , gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, view_uv);
        }

        bindFramebufferAndSetViewport(gl, fb, fbTex, fbTexWidth, fbTexHeight);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.useProgram(shaderProgram2);

        setupTexture(gl, fbTex, 2);
        gl.uniform1i(iTextureLoc, 2);
        gl.uniform2f(canvasDimsLoc2, gl.canvas.width, gl.canvas.height);
        gl.uniform2f(textureDimsLoc2, fbTexWidth, fbTexHeight);

        bindFramebufferAndSetViewport(gl, null, null, gl.canvas.width, gl.canvas.height);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
}
