export const oceanVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying float vWave;
  uniform float uTime;
  uniform float uMotion;
  uniform float uWaveAmplitude;
  uniform float uWaveSpeed;
  uniform float uBass;

  void main() {
    vec3 p = position;
    float waveA = sin(p.x * 0.19 + uTime * 0.75 * uWaveSpeed) * cos(p.y * 0.11 - uTime * 0.42 * uWaveSpeed);
    float waveB = sin((p.x + p.y) * 0.085 - uTime * 0.31 * uWaveSpeed);
    p.z += (waveA * 0.6 + waveB * 0.45) * uWaveAmplitude;
    float radius = length(p.xy);
    p.z += sin(radius * 0.75 - uTime * 3.0) * exp(-radius * 0.035) * uBass * 0.9;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorldPosition = world.xyz;
    vWave = waveA + waveB;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const oceanFragmentShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying float vWave;
  uniform float uEnergy;
  uniform float uFoam;
  uniform float uBass;
  uniform vec3 uOceanDeep;
  uniform vec3 uOceanBright;

  void main() {
    float rings = sin(length(vWorldPosition.xz) * 0.9 - vWave * 2.2);
    float grid = smoothstep(0.91, 1.0, abs(sin(vWorldPosition.x * 0.52)))
      + smoothstep(0.94, 1.0, abs(sin(vWorldPosition.z * 0.52)));
    vec3 color = mix(uOceanDeep, uOceanBright, clamp((vWave + 1.7) * 0.11 + grid * 0.055, 0.0, 0.42));
    color += vec3(0.24, 0.95, 0.72) * max(rings, 0.0) * 0.028 * uFoam * (0.35 + uEnergy);
    color += uOceanBright * pow(max(rings, 0.0), 8.0) * uBass * 0.65;
    float fade = smoothstep(72.0, 14.0, length(vWorldPosition.xz));
    gl_FragColor = vec4(color, fade * 0.94);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const cloudVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vNoise;
  uniform float uTime;
  uniform float uMotion;
  uniform float uTurbulence;

  void main() {
    vec3 p = position;
    float wobble = sin(position.x * 1.7 + position.y * 2.3 + uTime * 0.24) * 0.045 * uMotion * uTurbulence;
    p *= 1.0 + wobble;
    vec4 world = modelMatrix * instanceMatrix * vec4(p, 1.0);
    vWorldPosition = world.xyz;
    vNormal = normalize(mat3(modelMatrix * instanceMatrix) * normal);
    vNoise = wobble;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const cloudFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vNoise;
  uniform vec3 uBase;
  uniform vec3 uEdge;
  uniform float uEnergy;
  uniform float uAccent;

  void main() {
    vec3 lightA = normalize(vec3(-0.6, 0.85, 0.35));
    vec3 lightB = normalize(vec3(0.8, -0.15, -0.5));
    float facing = dot(normalize(vNormal), lightA);
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(cameraPosition - vWorldPosition))), 2.2);
    float steps = floor((facing * 0.5 + 0.5) * 4.0) / 4.0;
    float under = max(dot(normalize(vNormal), lightB), 0.0);
    vec3 color = uBase * (0.24 + steps * 0.75);
    color += uEdge * rim * (0.18 + uEnergy * 0.5);
    color += vec3(0.28, 0.7, 0.82) * rim * uAccent * 0.9;
    color += vec3(0.20, 0.08, 0.42) * under * 0.32;
    color += vNoise * uEdge;
    gl_FragColor = vec4(color, 0.96);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const glassVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vHeight;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vHeight = position.y;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const glassFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vHeight;
  uniform float uTime;
  uniform float uEnergy;
  uniform float uBass;
  uniform float uShimmer;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vNormal))), 2.35);
    float facet = floor((dot(normalize(vNormal), normalize(vec3(-0.4, 0.8, 0.35))) * 0.5 + 0.5) * 5.0) / 5.0;
    float pulse = 0.5 + 0.5 * sin(vHeight * 0.82 - uTime * 1.6);
    vec3 abyss = vec3(0.005, 0.055, 0.095);
    vec3 seafoam = vec3(0.23, 1.0, 0.72);
    vec3 ice = vec3(0.32, 0.9, 1.0);
    vec3 color = mix(abyss, ice, facet * 0.58 + fresnel * 0.48);
    color += seafoam * (0.1 + pulse * (0.12 + uEnergy * 0.24));
    color += vec3(0.36, 0.12, 0.8) * pow(fresnel, 3.0) * 0.42;
    color = mix(color, seafoam, uBass * 0.28);
    color += ice * fresnel * uShimmer * 0.8;
    gl_FragColor = vec4(color, 0.88 + fresnel * 0.1);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
