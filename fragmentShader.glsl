#version 300 es
precision mediump float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_texture;
uniform float u_time;
uniform vec4 u_ripples[10]; // Each ripple has x, y, startTime, and duration
uniform int u_numRipples;

void main() {
  vec2 uv = v_texCoord;
  vec4 color = texture(u_texture, uv);

    // Temporary variable to accumulate wave distortion
  vec2 distortion = vec2(0.0f);

  for(int i = 0; i < u_numRipples; i++) {
    vec2 center = u_ripples[i].xy;
    float startTime = u_ripples[i].z;
    float duration = u_ripples[i].w;

    float elapsed = u_time - startTime;
    if(elapsed < duration) {
      float pulsePeriod = 2.0f;
      float pulseAmplitude = 0.001f;

      float radius = elapsed * 0.25f + pulseAmplitude * sin(u_time * 2.0f * 3.14159f / pulsePeriod);
      float strength = exp(-elapsed * 0.5f); // Slower decay for stronger waves

      float distance = length(uv - center);

      if(distance < radius) {
                // Use smoothstep for softer edge transitions
        float edgeSoftness = 0.05f;
        float fade = smoothstep(radius - edgeSoftness, radius, distance);

        float waveFrequency = 5.0f;
        float waveAmplitude = 0.05f;
        float wave = sin(waveFrequency * (distance - elapsed * 0.2f)) * strength * waveAmplitude;

        distortion += normalize(uv - center) * wave * fade;
      }
    }
  }

    // Apply distortion to uv coordinates
  vec4 distortedColor = texture(u_texture, uv + distortion);
  outColor = mix(color, distortedColor, 1.0f); // Blend factor adjusted for stronger effect
}
