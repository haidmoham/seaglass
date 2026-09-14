import * as THREE from "three";

export function createSnow(time: { value: number }): THREE.Points {
  const positions = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i += 1) {
    positions[i * 3] = (((i * 0.61803398875) % 1) - 0.5) * 96;
    positions[i * 3 + 1] = ((i * 0.41421356237) % 1) * 54;
    positions[i * 3 + 2] = (((i * 0.73205080757) % 1) - 0.5) * 72;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: time },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime;
      void main() {
        vec3 p = position;
        p.y = mod(p.y - uTime * 1.4, 54.0) - 5.0;
        p.x += sin(uTime * 0.3 + position.z) * 1.2;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(150.0 / max(-view.z, 1.0), 1.0, 6.0);
      }
    `,
    fragmentShader: /* glsl */ `
      void main() {
        float alpha = 1.0 - smoothstep(0.1, 0.5, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(0.84, 0.92, 1.0, alpha * 0.8);
      }
    `,
  });
  return new THREE.Points(geometry, material);
}
