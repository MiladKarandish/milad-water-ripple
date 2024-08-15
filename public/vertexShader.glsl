#version 300 es
layout(location = 0) in vec4 a_position;
out vec2 v_texCoord;

void main() {
  gl_Position = a_position;
  v_texCoord = a_position.xy * 0.5f + 0.5f;
}
