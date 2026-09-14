import * as THREE from "three";
import {
  cloudFragmentShader,
  cloudVertexShader,
  glassFragmentShader,
  glassVertexShader,
  oceanFragmentShader,
  oceanVertexShader,
} from "./shaders";
import {
  weatherProfiles,
  type WeatherMode,
  type WeatherProfile,
} from "../weather/modes";

export interface StormSceneController {
  setEnergy(energy: number): void;
  setMotion(enabled: boolean): void;
  setIntensity(value: number): void;
  setImmersive(enabled: boolean): void;
  setWeather(mode: WeatherMode): void;
  resetCamera(): void;
  dispose(): void;
}

type Uniform<T> = { value: T };

interface StormUniforms {
  time: Uniform<number>;
  motion: Uniform<number>;
  energy: Uniform<number>;
  turbulence: Uniform<number>;
}

const TAU = Math.PI * 2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function approach(
  current: number,
  target: number,
  delta: number,
  speed = 2.4,
): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-delta * speed));
}

function transitionWeather(
  current: WeatherProfile,
  target: WeatherProfile,
  delta: number,
): void {
  current.rainDensity = approach(
    current.rainDensity,
    target.rainDensity,
    delta,
  );
  current.rainAngle = approach(current.rainAngle, target.rainAngle, delta);
  current.rainSpeed = approach(current.rainSpeed, target.rainSpeed, delta);
  current.cloudCoverage = approach(
    current.cloudCoverage,
    target.cloudCoverage,
    delta,
    1.5,
  );
  current.cloudRotation = approach(
    current.cloudRotation,
    target.cloudRotation,
    delta,
  );
  current.cloudHeight = approach(
    current.cloudHeight,
    target.cloudHeight,
    delta,
    1.35,
  );
  current.turbulence = approach(current.turbulence, target.turbulence, delta);
  current.debrisWind = approach(current.debrisWind, target.debrisWind, delta);
  current.lightningActivity = approach(
    current.lightningActivity,
    target.lightningActivity,
    delta,
    3.2,
  );
  current.waveAmplitude = approach(
    current.waveAmplitude,
    target.waveAmplitude,
    delta,
  );
  current.waveSpeed = approach(current.waveSpeed, target.waveSpeed, delta);
  current.foam = approach(current.foam, target.foam, delta);
  current.fogDensity = approach(
    current.fogDensity,
    target.fogDensity,
    delta,
    1.5,
  );
  current.exposure = approach(current.exposure, target.exposure, delta);
}

function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 91.345 + salt * 37.719) * 47453.5453;
  return value - Math.floor(value);
}

function makeCloudMaterial(
  uniforms: StormUniforms,
  base: number,
  edge: number,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: cloudVertexShader,
    fragmentShader: cloudFragmentShader,
    uniforms: {
      uTime: uniforms.time,
      uMotion: uniforms.motion,
      uEnergy: uniforms.energy,
      uTurbulence: uniforms.turbulence,
      uBase: { value: new THREE.Color(base) },
      uEdge: { value: new THREE.Color(edge) },
    },
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide,
  });
}

function buildCloudBand(
  count: number,
  radius: number,
  height: number,
  spread: number,
  geometry: THREE.IcosahedronGeometry,
  material: THREE.ShaderMaterial,
  salt: number,
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();

  for (let index = 0; index < count; index += 1) {
    const progress = index / count;
    const angle = progress * TAU * 2.4 + seeded(index, salt) * 0.7;
    const unevenRadius =
      radius +
      Math.sin(angle * 3.0) * spread * 0.22 +
      (seeded(index, salt + 1) - 0.5) * spread;
    const squash = 0.66 + Math.sin(angle * 2.0) * 0.08;
    dummy.position.set(
      Math.cos(angle) * unevenRadius,
      height +
        Math.sin(angle * 1.5) * spread * 0.18 +
        (seeded(index, salt + 2) - 0.5) * spread * 0.44,
      Math.sin(angle) * unevenRadius * squash,
    );
    const size = 1.45 + seeded(index, salt + 3) * 2.7;
    dummy.scale.set(
      size * (1.15 + seeded(index, salt + 4) * 0.65),
      size * (0.42 + seeded(index, salt + 5) * 0.42),
      size * (0.72 + seeded(index, salt + 6) * 0.55),
    );
    dummy.rotation.set(
      seeded(index, salt + 7) * Math.PI,
      angle,
      seeded(index, salt + 8) * 0.7,
    );
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

function buildStormCloud(uniforms: StormUniforms): THREE.Group {
  const storm = new THREE.Group();
  storm.position.y = 14;
  const puff = new THREE.IcosahedronGeometry(1, 1);

  const upper = makeCloudMaterial(uniforms, 0x182338, 0x553094);
  const middle = makeCloudMaterial(uniforms, 0x063747, 0x087575);
  const lower = makeCloudMaterial(uniforms, 0x211329, 0x963049);
  const crown = makeCloudMaterial(uniforms, 0x1a3442, 0xb8ffe6);

  storm.add(buildCloudBand(96, 24, 10, 11, puff, upper, 3));
  storm.add(buildCloudBand(112, 19, 5, 9, puff, middle, 11));
  storm.add(buildCloudBand(96, 13.5, 0, 7, puff, lower, 29));
  storm.add(buildCloudBand(64, 9, 16, 7, puff, crown, 47));

  for (let level = 0; level < 5; level += 1) {
    const funnel = buildCloudBand(
      28 - level * 3,
      9 - level * 1.45,
      -3 - level * 3.2,
      4.4 - level * 0.55,
      puff,
      lower,
      70 + level * 13,
    );
    funnel.rotation.y = level * 0.45;
    funnel.scale.setScalar(0.58 + level * 0.035);
    funnel.position.z = -8 - level * 0.6;
    storm.add(funnel);
  }
  return storm;
}

function createShardGeometry(
  radius: number,
  height: number,
  lean: number,
): THREE.BufferGeometry {
  const sides = 5;
  const vertices: number[] = [];
  const faces: number[] = [];
  for (let index = 0; index < sides; index += 1) {
    const angle = (index / sides) * TAU;
    vertices.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  }
  vertices.push(lean, height, -lean * 0.22);
  for (let index = 0; index < sides; index += 1) {
    faces.push(index, (index + 1) % sides, sides);
  }
  for (let index = 1; index < sides - 1; index += 1) {
    faces.push(0, index + 1, index);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  return geometry.toNonIndexed();
}

function buildSeaGlass(uniforms: StormUniforms): THREE.Group {
  const glass = new THREE.Group();
  const material = new THREE.ShaderMaterial({
    vertexShader: glassVertexShader,
    fragmentShader: glassFragmentShader,
    uniforms: { uTime: uniforms.time, uEnergy: uniforms.energy },
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const specs = [
    [2.8, 16, 1.6, 0, 0, 0],
    [2.2, 12, -1.2, -3.0, -0.2, 0.4],
    [1.8, 10, 1.0, 3.1, 0.1, -0.8],
    [1.5, 7.5, -0.8, -1.8, 0.5, -2.8],
    [1.2, 6.5, 0.7, 2.1, 0.3, 2.8],
  ];
  for (const spec of specs) {
    const shardGeometry = createShardGeometry(spec[0], spec[1], spec[2]);
    const shard = new THREE.Mesh(shardGeometry, material);
    shard.position.set(spec[3], spec[4], spec[5]);
    shard.rotation.y = spec[3] * 0.31 + spec[5] * 0.17;
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(shardGeometry, 18),
      new THREE.LineBasicMaterial({
        color: 0x9fffe0,
        transparent: true,
        opacity: 0.72,
      }),
    );
    shard.add(edges);
    glass.add(shard);
  }

  const core = new THREE.PointLight(0x6effda, 120, 54, 1.35);
  core.position.y = 7;
  glass.add(core);
  return glass;
}

function createLightning(
  seed: number,
  height: number,
  reach: number,
): THREE.LineSegments {
  const points: number[] = [];
  let x = (seeded(seed, 1) - 0.5) * 18;
  let y = height;
  let z = (seeded(seed, 2) - 0.5) * 12;
  const segments = 11;
  for (let index = 0; index < segments; index += 1) {
    const nextX = x + (seeded(index, seed + 3) - 0.5) * reach;
    const nextY = y - (2.2 + seeded(index, seed + 4) * 2.6);
    const nextZ = z + (seeded(index, seed + 5) - 0.5) * reach * 0.6;
    points.push(x, y, z, nextX, nextY, nextZ);
    if (index > 2 && index % 3 === 0) {
      points.push(
        nextX,
        nextY,
        nextZ,
        nextX + (seeded(index, seed + 7) - 0.5) * reach * 2.3,
        nextY - 3.8,
        nextZ + (seeded(index, seed + 8) - 0.5) * reach,
      );
    }
    x = nextX;
    y = nextY;
    z = nextZ;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points, 3),
  );
  const material = new THREE.LineBasicMaterial({
    color: 0xb8ffe6,
    transparent: true,
    opacity: 0.82,
  });
  return new THREE.LineSegments(geometry, material);
}

function buildRain(): THREE.LineSegments {
  const vertices: number[] = [];
  for (let index = 0; index < 720; index += 1) {
    const x = (seeded(index, 101) - 0.5) * 96;
    const y = seeded(index, 102) * 54 - 5;
    const z = (seeded(index, 103) - 0.5) * 72;
    const length = 0.8 + seeded(index, 104) * 2.8;
    vertices.push(x, y, z, x - length * 0.35, y - length, z + length * 0.08);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  const material = new THREE.LineBasicMaterial({
    color: 0x63d9d2,
    transparent: true,
    opacity: 0.17,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.LineSegments(geometry, material);
}

function buildDebris(): THREE.Group {
  const group = new THREE.Group();
  const geometry = new THREE.TetrahedronGeometry(0.55, 0);
  const dark = new THREE.MeshStandardMaterial({
    color: 0x07152a,
    roughness: 0.72,
    flatShading: true,
  });
  const bright = new THREE.MeshStandardMaterial({
    color: 0xc4ff72,
    emissive: 0x087575,
    roughness: 0.5,
    flatShading: true,
  });
  for (let index = 0; index < 46; index += 1) {
    const shard = new THREE.Mesh(geometry, index % 11 === 0 ? bright : dark);
    const angle = seeded(index, 201) * TAU;
    const radius = 7 + seeded(index, 202) * 19;
    shard.position.set(
      Math.cos(angle) * radius,
      2 + seeded(index, 203) * 20,
      Math.sin(angle) * radius * 0.65,
    );
    shard.scale.setScalar(0.45 + seeded(index, 204) * 1.6);
    shard.rotation.set(
      angle,
      seeded(index, 205) * TAU,
      seeded(index, 206) * TAU,
    );
    shard.userData.phase = angle;
    group.add(shard);
  }
  return group;
}

function disposeTree(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of materials) material.dispose();
    }
  });
}

export function createStormScene(
  canvas: HTMLCanvasElement,
): StormSceneController {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const skyColor = new THREE.Color(0x01040e);
  const fog = new THREE.FogExp2(0x010613, 0.0135);
  scene.background = skyColor;
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 180);

  const uniforms: StormUniforms = {
    time: { value: 0 },
    motion: { value: 1 },
    energy: { value: 0.18 },
    turbulence: { value: 1 },
  };
  const weather: WeatherProfile = { ...weatherProfiles.supercell };
  let weatherTarget: WeatherProfile = weatherProfiles.supercell;
  const weatherColors = {
    sky: new THREE.Color(weatherTarget.sky),
    fog: new THREE.Color(weatherTarget.fog),
    key: new THREE.Color(weatherTarget.keyLight),
    fill: new THREE.Color(weatherTarget.fillLight),
    oceanDeep: new THREE.Color(weatherTarget.oceanDeep),
    oceanBright: new THREE.Color(weatherTarget.oceanBright),
  };
  let intensity = 0.65;
  let targetEnergy = 0.18;
  let motionEnabled = true;
  let disposed = false;
  let frame = 0;
  let azimuth = -0.2;
  let elevation = 0.16;
  let targetAzimuth = azimuth;
  let targetElevation = elevation;
  let velocityX = 0;
  let velocityY = 0;
  let pointerDown = false;
  let immersive = false;
  let currentDistance = 54;
  let previousX = 0;
  let previousY = 0;
  let lastTime = performance.now();
  let cloudPhase = 0;
  let debrisPhase = 0;
  let rainFall = 0;

  const storm = buildStormCloud(uniforms);
  const glass = buildSeaGlass(uniforms);
  glass.position.set(0, -4.6, 4.5);
  glass.scale.setScalar(1.08);
  const debris = buildDebris();
  const rain = buildRain();
  const lightning = new THREE.Group();
  for (let index = 0; index < 7; index += 1) {
    const bolt = createLightning(
      index + 10,
      38 + seeded(index, 400) * 9,
      4 + seeded(index, 401) * 4,
    );
    bolt.rotation.y = (index / 7) * TAU;
    lightning.add(bolt);
  }

  const oceanGeometry = new THREE.PlaneGeometry(150, 120, 80, 64);
  const oceanMaterial = new THREE.ShaderMaterial({
    vertexShader: oceanVertexShader,
    fragmentShader: oceanFragmentShader,
    uniforms: {
      uTime: uniforms.time,
      uMotion: uniforms.motion,
      uEnergy: uniforms.energy,
      uWaveAmplitude: { value: weather.waveAmplitude },
      uWaveSpeed: { value: weather.waveSpeed },
      uFoam: { value: weather.foam },
      uOceanDeep: { value: new THREE.Color(weather.oceanDeep) },
      uOceanBright: { value: new THREE.Color(weather.oceanBright) },
    },
    transparent: true,
    depthWrite: true,
  });
  const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -5;

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(8.4, 10.5, 1.7, 9, 1, false),
    new THREE.MeshStandardMaterial({
      color: 0x05101e,
      metalness: 0.72,
      roughness: 0.27,
      flatShading: true,
    }),
  );
  plinth.position.y = -4.4;

  scene.add(ocean, plinth, storm, glass, debris, rain, lightning);
  scene.add(new THREE.HemisphereLight(0x8dbcca, 0x120819, 1.75));
  const cyanLight = new THREE.DirectionalLight(weather.keyLight, 2.8);
  cyanLight.position.set(-12, 24, 16);
  scene.add(cyanLight);
  const violetLight = new THREE.DirectionalLight(weather.fillLight, 2.2);
  violetLight.position.set(20, 12, -18);
  scene.add(violetLight);

  function fitCamera(): void {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.8 ? 57 : camera.aspect > 1.5 ? 42 : 48;
    camera.updateProjectionMatrix();
  }

  function positionCamera(): void {
    const rect = canvas.getBoundingClientRect();
    const narrow = rect.width / Math.max(rect.height, 1) < 0.8;
    const targetDistance = (narrow ? 78 : 74) - (immersive ? 18 : 0);
    currentDistance += (targetDistance - currentDistance) * 0.045;
    const distance = currentDistance;
    const focusY = 7.5;
    camera.position.set(
      Math.sin(azimuth) * Math.cos(elevation) * distance,
      focusY + Math.sin(elevation) * distance,
      Math.cos(azimuth) * Math.cos(elevation) * distance,
    );
    const focusX = narrow ? 0 : -1.8;
    camera.lookAt(focusX, focusY, 0);
  }

  function onPointerDown(event: PointerEvent): void {
    pointerDown = true;
    previousX = event.clientX;
    previousY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent): void {
    if (!pointerDown) return;
    const deltaX = event.clientX - previousX;
    const deltaY = event.clientY - previousY;
    previousX = event.clientX;
    previousY = event.clientY;
    velocityX = deltaX * -0.0045;
    velocityY = deltaY * 0.0032;
    targetAzimuth += velocityX;
    targetElevation = clamp(targetElevation + velocityY, -0.12, 0.5);
  }

  function onPointerUp(event: PointerEvent): void {
    pointerDown = false;
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
  }

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  const resizeObserver = new ResizeObserver(fitCamera);
  resizeObserver.observe(canvas);
  fitCamera();

  let elapsedTime = 0;
  function onKeyDown(event: KeyboardEvent): void {
    const step = 0.11;
    if (event.key === "ArrowLeft") targetAzimuth -= step;
    else if (event.key === "ArrowRight") targetAzimuth += step;
    else if (event.key === "ArrowUp")
      targetElevation = clamp(targetElevation + step, -0.12, 0.5);
    else if (event.key === "ArrowDown")
      targetElevation = clamp(targetElevation - step, -0.12, 0.5);
    else return;
    event.preventDefault();
  }
  canvas.addEventListener("keydown", onKeyDown);

  function render(now: number): void {
    if (disposed) return;
    const delta = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    if (motionEnabled) elapsedTime += delta;
    const elapsed = elapsedTime;
    const temporal = motionEnabled ? 1 : 0;
    uniforms.motion.value = temporal;
    uniforms.energy.value +=
      (targetEnergy - uniforms.energy.value) * Math.min(1, delta * 4.5);
    transitionWeather(weather, weatherTarget, delta);
    uniforms.turbulence.value = weather.turbulence;
    oceanMaterial.uniforms.uWaveAmplitude.value = weather.waveAmplitude;
    oceanMaterial.uniforms.uWaveSpeed.value = weather.waveSpeed;
    oceanMaterial.uniforms.uFoam.value = weather.foam;
    oceanMaterial.uniforms.uOceanDeep.value.lerp(
      weatherColors.oceanDeep,
      1 - Math.exp(-delta * 1.8),
    );
    oceanMaterial.uniforms.uOceanBright.value.lerp(
      weatherColors.oceanBright,
      1 - Math.exp(-delta * 1.8),
    );
    skyColor.lerp(weatherColors.sky, 1 - Math.exp(-delta * 1.35));
    fog.color.lerp(weatherColors.fog, 1 - Math.exp(-delta * 1.35));
    fog.density = weather.fogDensity;
    cyanLight.color.lerp(weatherColors.key, 1 - Math.exp(-delta * 1.8));
    violetLight.color.lerp(weatherColors.fill, 1 - Math.exp(-delta * 1.8));
    if (motionEnabled) uniforms.time.value = elapsed;

    const cloudWidth = 0.68 + weather.cloudCoverage * 0.2;
    storm.scale.set(
      cloudWidth,
      0.85 + weather.cloudCoverage * 0.08,
      cloudWidth,
    );
    storm.position.y = 14 + weather.cloudHeight;
    storm.position.x = weather.cloudHeight * 0.42;
    rain.rotation.z = weather.rainAngle * 0.18;
    rain.geometry.setDrawRange(0, Math.floor(720 * weather.rainDensity) * 2);

    if (!pointerDown) {
      targetAzimuth += velocityX;
      targetElevation = clamp(targetElevation + velocityY, -0.12, 0.5);
      velocityX *= Math.pow(0.055, delta);
      velocityY *= Math.pow(0.035, delta);
    }
    azimuth += (targetAzimuth - azimuth) * Math.min(1, delta * 9);
    elevation += (targetElevation - elevation) * Math.min(1, delta * 9);
    positionCamera();

    if (motionEnabled) {
      cloudPhase += delta * weather.cloudRotation * (0.035 + intensity * 0.025);
      debrisPhase -= delta * weather.debrisWind * (0.08 + intensity * 0.13);
      rainFall = (rainFall + delta * weather.rainSpeed) % 13;
      storm.rotation.y = cloudPhase;
      debris.rotation.y = debrisPhase;
      for (let index = 0; index < storm.children.length; index += 1) {
        const layer = storm.children[index];
        const direction = index % 2 === 0 ? 1 : -1;
        const layerRate = 0.018 + index * 0.0035;
        layer.rotation.y +=
          delta *
          direction *
          layerRate *
          weather.cloudRotation *
          (0.45 + weather.turbulence * 0.55);
      }
      glass.position.y =
        -4.6 + Math.sin(elapsed * 0.72) * 0.2 * weather.turbulence;
      glass.rotation.y = Math.sin(elapsed * 0.31) * 0.045 * weather.debrisWind;
      for (let index = 0; index < debris.children.length; index += 1) {
        const child = debris.children[index];
        child.rotation.x +=
          delta * weather.debrisWind * (0.25 + intensity * 0.8);
        child.rotation.z -= delta * 0.31;
        child.position.y += Math.sin(elapsed * 1.2 + index) * delta * 0.16;
      }
      rain.position.y = -rainFall;
    }

    const energy = uniforms.energy.value;
    for (let index = 0; index < lightning.children.length; index += 1) {
      const bolt = lightning.children[index];
      const pulse = Math.sin(elapsed * (0.72 + index * 0.07) + index * 4.3);
      const staticHeroBolt = elapsed < 0.02 && (index === 1 || index === 5);
      bolt.visible =
        weather.lightningActivity > 0.05 &&
        (staticHeroBolt ||
          pulse >
            0.9 - (energy * 0.14) / Math.max(weather.lightningActivity, 0.1));
      if (
        bolt instanceof THREE.LineSegments &&
        bolt.material instanceof THREE.LineBasicMaterial
      ) {
        bolt.material.opacity =
          clamp((pulse - 0.76) * 4.0, 0.08, 0.84) * (0.35 + intensity * 0.65);
      }
    }
    renderer.toneMappingExposure =
      weather.exposure + intensity * 0.12 + energy * 0.12;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  }
  frame = requestAnimationFrame(render);

  return {
    setEnergy(energy: number): void {
      targetEnergy = clamp(energy, 0, 1);
    },
    setMotion(enabled: boolean): void {
      motionEnabled = enabled;
    },
    setIntensity(value: number): void {
      intensity = clamp(value, 0.25, 1.5);
    },
    setImmersive(enabled: boolean): void {
      immersive = enabled;
    },
    setWeather(mode: WeatherMode): void {
      weatherTarget = weatherProfiles[mode];
      weatherColors.sky.setHex(weatherTarget.sky);
      weatherColors.fog.setHex(weatherTarget.fog);
      weatherColors.key.setHex(weatherTarget.keyLight);
      weatherColors.fill.setHex(weatherTarget.fillLight);
      weatherColors.oceanDeep.setHex(weatherTarget.oceanDeep);
      weatherColors.oceanBright.setHex(weatherTarget.oceanBright);
    },
    resetCamera(): void {
      targetAzimuth = -0.2;
      targetElevation = 0.16;
      velocityX = 0;
      velocityY = 0;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("keydown", onKeyDown);
      disposeTree(scene);
      renderer.dispose();
    },
  };
}
