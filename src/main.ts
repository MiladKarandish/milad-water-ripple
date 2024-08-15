import * as dat from 'dat.gui';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

if (!gl) {
  console.error('WebGL2 not supported');
  throw new Error('WebGL2 not supported');
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

async function loadShaderSource(url: string): Promise<string> {
  const response = await fetch(url);
  return response.text();
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create shader');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error('Error compiling shader');
  }

  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create program');

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

// Create a dat.GUI instance
const gui = new dat.GUI();

// Dynamic properties
const params = {
  rippleAmplitude: 0.05,
  rippleFrequency: 5.0,
  ripplePulseAmplitude: 0.001,
  rippleEdgeSoftness: 0.1,
  rippleDecay: 0.5,
  rippleSpeed: 1.0,
  rippleStrength: 1.0,
  ambientIntensity: 0.5,
  specularIntensity: 1.0,
  textureTiling: [1.0, 1.0],
  lightPosition: [0.5, 0.5, 1.0],
  lightColor: [1.0, 1.0, 1.0],
  ambientColor: [0.2, 0.2, 0.2],
};

// Add properties to GUI
gui.add(params, 'rippleAmplitude', 0, 0.1).name('Ripple Amplitude');
gui.add(params, 'rippleFrequency', 0, 20).name('Ripple Frequency');
gui.add(params, 'ripplePulseAmplitude', 0, 0.01).name('Ripple Pulse Amplitude');
gui.add(params, 'rippleEdgeSoftness', 0, 0.5).name('Ripple Edge Softness');
gui.add(params, 'rippleDecay', 0, 1).name('Ripple Decay');
gui.add(params, 'rippleSpeed', 0, 5).name('Ripple Speed');
gui.add(params, 'rippleStrength', 0, 5).name('Ripple Strength');
gui.add(params, 'ambientIntensity', 0, 1).name('Ambient Intensity');
gui.add(params, 'specularIntensity', 0, 10).name('Specular Intensity');
gui.add(params.textureTiling, 0, 0.1, 5).name('Texture Tiling X');
gui.add(params.textureTiling, 1, 0.1, 5).name('Texture Tiling Y');
gui.addColor(params, 'lightColor').name('Light Color');
gui.addColor(params, 'ambientColor').name('Ambient Color');
gui
  .add(params.lightPosition, 0, 0, 1)
  .name('Light X')
  .onChange(() => updateUniforms());
gui
  .add(params.lightPosition, 1, 0, 1)
  .name('Light Y')
  .onChange(() => updateUniforms());
gui
  .add(params.lightPosition, 2, 0, 1)
  .name('Light Z')
  .onChange(() => updateUniforms());

let lightPositionLocation: WebGLUniformLocation | null;
let lightColorLocation: WebGLUniformLocation | null;
let ambientColorLocation: WebGLUniformLocation | null;
let rippleAmplitudeLocation: WebGLUniformLocation | null;
let rippleFrequencyLocation: WebGLUniformLocation | null;
let ripplePulseAmplitudeLocation: WebGLUniformLocation | null;
let rippleEdgeSoftnessLocation: WebGLUniformLocation | null;
let rippleDecayLocation: WebGLUniformLocation | null;
let rippleSpeedLocation: WebGLUniformLocation | null;
let rippleStrengthLocation: WebGLUniformLocation | null;
let ambientIntensityLocation: WebGLUniformLocation | null;
let specularIntensityLocation: WebGLUniformLocation | null;
let textureTilingLocation: WebGLUniformLocation | null;

function updateUniforms() {
  if (lightPositionLocation && lightColorLocation && ambientColorLocation) {
    gl.uniform3fv(lightPositionLocation, params.lightPosition);
    gl.uniform3fv(lightColorLocation, params.lightColor);
    gl.uniform3fv(ambientColorLocation, params.ambientColor);
  }
}

async function main() {
  const vertexShaderSource = await loadShaderSource('/vertexShader.glsl');
  const fragmentShaderSource = await loadShaderSource('/fragmentShader.glsl');

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  lightPositionLocation = gl.getUniformLocation(program, 'u_lightPosition');
  lightColorLocation = gl.getUniformLocation(program, 'u_lightColor');
  ambientColorLocation = gl.getUniformLocation(program, 'u_ambientColor');
  rippleAmplitudeLocation = gl.getUniformLocation(program, 'rippleAmplitude');
  rippleFrequencyLocation = gl.getUniformLocation(program, 'rippleFrequency');
  ripplePulseAmplitudeLocation = gl.getUniformLocation(
    program,
    'ripplePulseAmplitude'
  );
  rippleEdgeSoftnessLocation = gl.getUniformLocation(
    program,
    'rippleEdgeSoftness'
  );
  rippleDecayLocation = gl.getUniformLocation(program, 'rippleDecay');
  rippleSpeedLocation = gl.getUniformLocation(program, 'rippleSpeed');
  rippleStrengthLocation = gl.getUniformLocation(program, 'rippleStrength');
  ambientIntensityLocation = gl.getUniformLocation(program, 'ambientIntensity');
  specularIntensityLocation = gl.getUniformLocation(
    program,
    'specularIntensity'
  );
  textureTilingLocation = gl.getUniformLocation(program, 'textureTiling');

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

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const image = new Image();
  image.src = './path_to_your_image.jpg';
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    render();
  };

  const maxRipples = 50;
  const ripples = new Float32Array(maxRipples * 4);
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

    // Update dynamic parameters
    if (rippleAmplitudeLocation)
      gl.uniform1f(rippleAmplitudeLocation, params.rippleAmplitude);
    if (rippleFrequencyLocation)
      gl.uniform1f(rippleFrequencyLocation, params.rippleFrequency);
    if (ripplePulseAmplitudeLocation)
      gl.uniform1f(ripplePulseAmplitudeLocation, params.ripplePulseAmplitude);
    if (rippleEdgeSoftnessLocation)
      gl.uniform1f(rippleEdgeSoftnessLocation, params.rippleEdgeSoftness);
    if (rippleDecayLocation)
      gl.uniform1f(rippleDecayLocation, params.rippleDecay);
    if (rippleSpeedLocation)
      gl.uniform1f(rippleSpeedLocation, params.rippleSpeed);
    if (rippleStrengthLocation)
      gl.uniform1f(rippleStrengthLocation, params.rippleStrength);
    if (ambientIntensityLocation)
      gl.uniform1f(ambientIntensityLocation, params.ambientIntensity);
    if (specularIntensityLocation)
      gl.uniform1f(specularIntensityLocation, params.specularIntensity);
    if (textureTilingLocation)
      gl.uniform2fv(textureTilingLocation, params.textureTiling);

    updateUniforms(); // Ensure light-related uniforms are updated

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }

  render();
}

main().catch(console.error);
