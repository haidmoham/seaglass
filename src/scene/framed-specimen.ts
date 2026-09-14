import * as THREE from "three";

const specimenVertexShader = /* glsl */ `
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform float uTime;
  uniform float uBass;
  uniform float uAccent;
  uniform vec2 uPointer;

  void main() {
    vec3 direction = normalize(position);
    float slowFold = sin(position.y * 3.1 + uTime * 0.42)
      * cos(position.x * 2.7 - uTime * 0.29)
      + sin((position.z + position.y) * 3.3 + uTime * 0.25);
    float fineFold = sin(position.x * 3.2 + position.z * 2.7 - uTime * 0.31);
    float response = slowFold * (0.2 + uBass * 0.09) + fineFold * (0.035 + uAccent * 0.04);
    vec3 p = position + direction * response;
    p.x *= 1.0 + sin(position.y * 2.4 - uTime * 0.11) * 0.08;
    p.y *= 1.0 + cos(position.x * 2.1 + uTime * 0.09) * 0.07;
    p.x += uPointer.x * (0.045 + 0.025 * (position.y + 1.0));
    p.y += uPointer.y * (0.04 + 0.02 * (1.0 - position.x));
    vec4 world = modelMatrix * vec4(p, 1.0);
    vLocalPosition = p;
    vWorldPosition = world.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const specimenFragmentShader = /* glsl */ `
  varying vec3 vLocalPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform float uOpacity;
  uniform float uShimmer;
  uniform vec2 uPointer;

  void main() {
    vec2 p = vLocalPosition.xy;
    vec2 pinkCenter = vec2(0.58 + uPointer.x * 0.05, -0.05);
    float pinkWeight = exp(-dot(p - pinkCenter, p - pinkCenter) * 2.2);
    vec2 orangeCenter = vec2(0.08, 0.72);
    float orangeWeight = exp(-dot(p - orangeCenter, p - orangeCenter) * 2.35);
    vec2 tealCenter = vec2(-0.67, 0.02 + uPointer.y * 0.04);
    float tealWeight = exp(-dot(p - tealCenter, p - tealCenter) * 2.15);
    vec2 mauveCenter = vec2(-0.03, -0.68);
    float mauveWeight = exp(-dot(p - mauveCenter, p - mauveCenter) * 2.0);
    float weightTotal = pinkWeight + orangeWeight + tealWeight + mauveWeight;
    vec3 mauve = vec3(0.25, 0.035, 0.13);
    vec3 hotPink = vec3(0.65, 0.012, 0.18);
    vec3 orange = vec3(0.78, 0.09, 0.012);
    vec3 teal = vec3(0.004, 0.27, 0.23);
    vec3 color = (
      hotPink * pinkWeight
      + orange * orangeWeight
      + teal * tealWeight
      + mauve * mauveWeight
    ) / max(weightTotal, 0.001);

    vec3 deformedNormal = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
    if (dot(deformedNormal, vWorldNormal) < 0.0) deformedNormal *= -1.0;
    vec3 surfaceNormal = deformedNormal;
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(vec3(-0.42, 0.76, 0.5));
    float diffuse = max(dot(surfaceNormal, lightDirection), 0.0);
    float broadHighlight = pow(max(dot(reflect(-lightDirection, surfaceNormal), viewDirection), 0.0), 18.0);
    float fresnel = pow(1.0 - abs(dot(surfaceNormal, viewDirection)), 2.1);
    color *= 0.18 + diffuse * 0.95;
    color += vec3(0.96, 0.9, 0.82) * broadHighlight * 0.48;
    color += mix(vec3(0.04, 0.5, 0.46), vec3(0.76, 0.12, 0.32), pinkWeight) * fresnel * (0.18 + uShimmer * 0.1);
    float innerContour = smoothstep(0.32, 0.5, fresnel) * (1.0 - smoothstep(0.68, 0.84, fresnel));
    color += vec3(0.12, 0.52, 0.48) * innerContour * 0.13;
    color += vec3(0.98, 0.87, 0.76) * uShimmer * 0.045;
    gl_FragColor = vec4(color, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface FramedSpecimen {
  object: THREE.Mesh;
  update(
    delta: number,
    motionEnabled: boolean,
    immersive: boolean,
    bass: number,
    accent: number,
    shimmer: number,
    pointerX: number,
    pointerY: number,
  ): void;
}

export function createFramedSpecimen(): FramedSpecimen {
  const uniforms = {
    uTime: { value: 0 },
    uBass: { value: 0 },
    uAccent: { value: 0 },
    uShimmer: { value: 0 },
    uOpacity: { value: 1 },
    uPointer: { value: new THREE.Vector2() },
  };
  const geometry = new THREE.SphereGeometry(1, 64, 48);
  const material = new THREE.ShaderMaterial({
    vertexShader: specimenVertexShader,
    fragmentShader: specimenFragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
  });
  const object = new THREE.Mesh(geometry, material);
  object.position.set(0, 7.5, 0);
  object.scale.setScalar(16);
  object.rotation.set(-0.08, -0.24, 0.12);
  object.renderOrder = 8;

  let time = 0;
  let opacity = 1;
  let scale = 1;
  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();

  return {
    object,
    update(
      delta: number,
      motionEnabled: boolean,
      immersive: boolean,
      bass: number,
      accent: number,
      shimmer: number,
      pointerX: number,
      pointerY: number,
    ): void {
      if (motionEnabled) time += delta;
      const blend = 1 - Math.exp(-delta * (immersive ? 2.8 : 1.9));
      opacity = THREE.MathUtils.lerp(opacity, immersive ? 0 : 1, blend);
      scale = THREE.MathUtils.lerp(scale, immersive ? 1.48 : 1, blend);
      if (motionEnabled) {
        pointerTarget.set(pointerX, pointerY);
        pointer.lerp(pointerTarget, 1 - Math.exp(-delta * 4.2));
      }
      uniforms.uTime.value = time;
      uniforms.uBass.value = bass;
      uniforms.uAccent.value = accent;
      uniforms.uShimmer.value = shimmer;
      uniforms.uOpacity.value = opacity;
      uniforms.uPointer.value.copy(pointer);
      object.scale.setScalar(16 * scale);
      object.visible = opacity > 0.005;
    },
  };
}
