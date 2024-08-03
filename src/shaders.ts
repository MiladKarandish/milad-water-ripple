export const vertexShaderSource = `#version 300 es

layout(location = 1) in float aPointSize;
layout(location = 0) in vec2 aPosition;
layout(location = 2) in vec3 aColor;

out vec3 vColor;

void main() {
  vColor = aColor;
  gl_PointSize = aPointSize;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `#version 300 es
precision mediump float;

in vec3 vColor;

out vec4 fragColor;

void main() {
  fragColor = vec4(vColor, 1.0);
}
`;
