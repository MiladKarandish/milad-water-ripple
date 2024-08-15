const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

if (!gl) {
  console.error('WebGL2 not supported');
  throw new Error('WebGL2 not supported');
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Shader source loading function
async function loadShaderSource(url: string): Promise<string> {
  const response = await fetch(url);
  return response.text();
}

// Shader compilation error checking
function compileShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Unable to create shader');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error('Error compiling shader');
  }

  return shader;
}

// Program linking error checking
function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Unable to create program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error('Error linking program');
  }

  return program;
}

// Main function
async function main() {
  const vertexShaderSource = await loadShaderSource('vertexShader.glsl');
  const fragmentShaderSource = await loadShaderSource('fragmentShader.glsl');

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  const lightPositionLocation = gl.getUniformLocation(
    program,
    'u_lightPosition'
  );
  const lightColorLocation = gl.getUniformLocation(program, 'u_lightColor');
  const ambientColorLocation = gl.getUniformLocation(program, 'u_ambientColor');

  // Set lighting parameters
  const lightPosition = [0.5, 0.5, 1.0]; // Example light position
  const lightColor = [1.0, 1.0, 1.0]; // White light
  const ambientColor = [0.2, 0.2, 0.2]; // Low ambient light

  gl.uniform3fv(lightPositionLocation, lightPosition);
  gl.uniform3fv(lightColorLocation, lightColor);
  gl.uniform3fv(ambientColorLocation, ambientColor);

  const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
  const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
  const textureUniformLocation = gl.getUniformLocation(program, 'u_texture');
  const ripplesUniformLocation = gl.getUniformLocation(program, 'u_ripples');
  const numRipplesUniformLocation = gl.getUniformLocation(
    program,
    'u_numRipples'
  );

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // Load a texture
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const image = new Image();
  image.src = 'path_to_your_image.jpg'; // Replace with the path to your image
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    render();
  };

  // Ripple data
  const maxRipples = 50;
  const ripples = new Float32Array(maxRipples * 4); // Each ripple has x, y, startTime, and duration
  let numRipples = 0;

  class Ripple {
    x: number;
    y: number;
    startTime: number;
    duration: number;

    constructor(
      x: number,
      y: number,
      startTime: number,
      duration: number = 6.0
    ) {
      // Duration can be adjusted for realism
      this.x = x;
      this.y = y;
      this.startTime = startTime;
      this.duration = duration;
    }

    update(_: number) {
      // No need to update properties; shader will use time-based calculations
    }
  }

  const rippleObjects: Ripple[] = [];

  function addRipple(x: number, y: number) {
    if (numRipples < maxRipples) {
      rippleObjects.push(new Ripple(x, y, performance.now() * 0.001));
      numRipples++;
    }
  }

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = 1.0 - (event.clientY - rect.top) / rect.height;
    addRipple(x, y);
  });

  function updateRipples(currentTime: number) {
    rippleObjects.forEach((ripple, index) => {
      ripple.update(currentTime);
      ripples[index * 4] = ripple.x;
      ripples[index * 4 + 1] = ripple.y;
      ripples[index * 4 + 2] = ripple.startTime;
      ripples[index * 4 + 3] = ripple.duration;
    });

    // Remove ripples that have completed their duration
    if (
      rippleObjects.length > 0 &&
      currentTime - rippleObjects[0].startTime > rippleObjects[0].duration
    ) {
      rippleObjects.shift();
      numRipples--;
    }
  }

  function render() {
    const currentTime = performance.now() * 0.001;
    updateRipples(currentTime);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform1f(timeUniformLocation, currentTime);
    gl.uniform1i(textureUniformLocation, 0);
    gl.uniform4fv(ripplesUniformLocation, ripples);
    gl.uniform1i(numRipplesUniformLocation, numRipples);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }

  render();
}

main().catch(console.error);
