import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform float uBass;
  uniform float uAccent;
  uniform float uShimmer;
  uniform vec2 uPointer;
  uniform float uMagnet;
  uniform float uSeed;

  vec2 hash(vec2 p) {
    p += uSeed;
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)),
      dot(p, vec2(269.5, 183.3)))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 w = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i).x, hash(i + vec2(1,0)).x, w.x),
      mix(hash(i + vec2(0,1)).x, hash(i + vec2(1,1)).x, w.x), w.y);
  }
  float cloud(vec2 p) {
    float value = 0.0, amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += noise(p) * amplitude;
      p = mat2(1.6, 1.2, -1.2, 1.6) * p + 13.2;
      amplitude *= 0.5;
    }
    return value;
  }
  vec3 polarizedStars(vec2 uv, float density, float depth, float polarity) {
    vec2 center = uPointer * vec2(uAspect, 1.0) * 0.5;
    vec2 offset = uv - center;
    float influence = exp(-dot(offset, offset) * 12.0) * uMagnet * 0.4;
    // Separate inverse fields keep each star's seeded polarity stable in motion.
    uv += offset * influence * polarity * (0.9 + depth * 0.45);
    uv += vec2(-offset.y, offset.x) * influence * polarity * 0.22;
    vec2 grid = (uv + uPointer * depth * 0.014) * density;
    grid += vec2(uTime * depth * 0.025, uTime * depth * 0.009);
    vec2 cell = floor(grid), local = fract(grid) - 0.5;
    vec2 seed = hash(cell + depth * 37.0);
    float charge = hash(cell + depth * 37.0 + 91.0).x < 0.5 ? -1.0 : 1.0;
    if (charge != polarity) return vec3(0.0);
    vec2 point = local - (seed - 0.5) * 0.65;
    float radius = length(point);
    float bright = step(0.80, seed.x);
    float pulse = 0.7 + 0.3 * sin(uTime * (0.4 + seed.y) + seed.x * 40.0);
    float core = exp(-radius * radius * 2300.0);
    float halo = exp(-radius * 24.0) * (0.15 + uBass * 0.6);
    float cross = exp(-abs(point.x) * 150.0 - abs(point.y) * 15.0)
      + exp(-abs(point.y) * 150.0 - abs(point.x) * 15.0);
    float flare = cross * step(0.975, seed.x) * (0.8 + uAccent * 2.0);
    vec3 tint = mix(vec3(0.4,0.7,1.0), vec3(1.0,0.72,0.95), seed.y);
    return tint * (bright * (core + halo) * pulse + flare) * (1.0 + influence * 1.6)
      * (0.7 + depth * 0.35 + uShimmer * 0.7);
  }
  vec3 stars(vec2 uv, float density, float depth) {
    return polarizedStars(uv, density, depth, 1.0)
      + polarizedStars(uv, density, depth, -1.0);
  }
  void main() {
    vec2 uv = (vUv - 0.5) * vec2(uAspect, 1.0);
    vec2 drift = uv * 2.3 + vec2(uTime * 0.013, -uTime * 0.008);
    float vapor = cloud(drift + cloud(drift * 0.8));
    float ribbon = exp(-pow((uv.y - sin(uv.x * 2.0 + uTime * 0.025) * 0.2) * 3.2, 2.0));
    float light = pow(vapor, 2.8) * ribbon * (1.1 + uBass * 0.6);
    vec3 color = vec3(0.012,0.018,0.05);
    color += mix(vec3(0.08,0.13,0.52), vec3(0.52,0.06,0.48), vapor) * light;
    color += vec3(0.02,0.35,0.42) * pow(cloud(drift + 8.0), 4.0) * ribbon;
    color += stars(uv, 38.0, 0.4);
    color += stars(uv, 21.0, 0.9);
    color += stars(uv, 9.0, 1.5);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/** One seed per field; motion remains deterministic for that seed. */
export function createStarfield(seed = Math.random() * 1000) {
  const uniforms = {
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uBass: { value: 0 },
    uAccent: { value: 0 },
    uShimmer: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uMagnet: { value: 0 },
    uSeed: { value: seed },
  };
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false,
  });
  const object = new THREE.Mesh(geometry, material);
  object.frustumCulled = false;
  const pointerTarget = new THREE.Vector2();
  return {
    object,
    resize(aspect: number) { uniforms.uAspect.value = aspect; },
    update(delta: number, motion: boolean, bass: number, accent: number,
      shimmer: number, pointerX: number, pointerY: number, magnet: boolean) {
      if (!motion) return;
      uniforms.uTime.value += delta;
      const blend = 1 - Math.exp(-delta * 5);
      uniforms.uBass.value = THREE.MathUtils.lerp(uniforms.uBass.value, bass, blend);
      uniforms.uAccent.value = THREE.MathUtils.lerp(uniforms.uAccent.value, accent, blend);
      uniforms.uShimmer.value = THREE.MathUtils.lerp(uniforms.uShimmer.value, shimmer, blend);
      pointerTarget.set(pointerX, pointerY);
      uniforms.uPointer.value.lerp(pointerTarget, blend);
      uniforms.uMagnet.value = THREE.MathUtils.lerp(uniforms.uMagnet.value, magnet ? 1 : 0, blend);
    },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
