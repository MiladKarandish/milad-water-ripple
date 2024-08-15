#version 300 es
precision mediump float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_texture;
uniform float u_time;
uniform vec4 u_ripples[50]; // Each ripple has x, y, startTime, and duration
uniform int u_numRipples;

// Light parameters
uniform vec3 u_lightPosition;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;

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
                // Increase edge softness for thicker edges
        float edgeSoftness = 0.1f; // Increased edge softness
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

    // Calculate fake normal from distortion
  vec3 normal = normalize(vec3(distortion * 10.0f, 1.0f)); // Amplify distortion for more visible effect

    // Lighting calculations
  vec3 lightDir = normalize(u_lightPosition - vec3(uv, 0.0f));
  float diff = max(dot(normal, lightDir), 0.0f);

  vec3 ambient = u_ambientColor;
  vec3 diffuse = diff * u_lightColor;

  vec3 finalColor = (ambient + diffuse) * distortedColor.rgb;
  outColor = vec4(finalColor, 1.0f);
}
