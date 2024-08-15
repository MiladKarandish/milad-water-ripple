#version 300 es
precision mediump float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_texture;
uniform float u_time;
uniform vec4 u_ripples[50];
uniform int u_numRipples;

uniform vec3 u_lightPosition;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;
uniform float rippleAmplitude;
uniform float rippleFrequency;
uniform float ripplePulseAmplitude;
uniform float rippleEdgeSoftness;
uniform float rippleDecay;
uniform float rippleSpeed;
uniform float rippleStrength;
uniform float ambientIntensity;
uniform float specularIntensity;
uniform vec2 textureTiling;

void main() {
  vec2 uv = v_texCoord * textureTiling; // Apply texture tiling
  vec4 color = texture(u_texture, uv);

  vec2 distortion = vec2(0.0f);
  float distance, radius, strength, fade, wave;

  for(int i = 0; i < u_numRipples; i++) {
    vec2 center = u_ripples[i].xy;
    float startTime = u_ripples[i].z;
    float duration = u_ripples[i].w;

    float elapsed = u_time - startTime;
    if(elapsed < duration) {
      radius = rippleSpeed * (elapsed * 0.25f + ripplePulseAmplitude * sin(u_time * 2.0f * 3.14159f / rippleFrequency));
      strength = exp(-elapsed * rippleDecay) * rippleStrength;
      distance = length(uv - center);

      if(distance < radius) {
        fade = smoothstep(radius - rippleEdgeSoftness, radius, distance);
        wave = sin(rippleFrequency * (distance - elapsed * 0.2f)) * strength * rippleAmplitude;
        distortion += normalize(uv - center) * wave * fade;
      }
    }
  }

  vec4 distortedColor = texture(u_texture, uv + distortion);
  vec3 normal = normalize(vec3(distortion * 10.0f, 1.0f));

  vec3 lightDir = normalize(u_lightPosition - vec3(uv, 0.0f));
  float diff = max(dot(normal, lightDir), 0.0f);

  vec3 ambient = ambientIntensity * u_ambientColor;
  vec3 diffuse = diff * u_lightColor;

  vec3 finalColor = (ambient + diffuse) * distortedColor.rgb;
  outColor = vec4(finalColor, 1.0f);
}
