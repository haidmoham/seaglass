import { useEffect, useRef } from "react";
import * as THREE from "three";
import { authoredReaction } from "../music/reactivity";
import { createFramedSpecimen } from "../scene/framed-specimen";

interface BackgroundArtworkProps {
  motion: boolean;
  time: number;
  playing: boolean;
}

export function BackgroundArtwork({
  motion,
  time,
  playing,
}: BackgroundArtworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionRef = useRef(motion);
  const playbackRef = useRef({ time, playing, updatedAt: performance.now() });
  motionRef.current = motion;

  useEffect(() => {
    playbackRef.current = { time, playing, updatedAt: performance.now() };
  }, [time, playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 140);
    camera.position.set(0, 7.5, 65);
    camera.lookAt(0, 7.5, 0);

    const specimen = createFramedSpecimen();
    scene.add(specimen.object);

    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;
    let disposed = false;
    let previousTime = performance.now();

    function resize(): void {
      const rect = renderer.domElement.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = camera.aspect < 0.8 ? 52 : 43;
      camera.updateProjectionMatrix();
    }

    function handlePointerMove(event: PointerEvent): void {
      pointerX = THREE.MathUtils.clamp(
        (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1,
        -1,
        1,
      );
      pointerY = THREE.MathUtils.clamp(
        -(event.clientY / Math.max(window.innerHeight, 1)) * 2 + 1,
        -1,
        1,
      );
    }

    function render(now: number): void {
      if (disposed) return;
      const delta = Math.min(0.05, Math.max(0, (now - previousTime) / 1000));
      previousTime = now;
      const playback = playbackRef.current;
      const age = Math.max(0, (now - playback.updatedAt) / 1000);
      const active = playback.playing && age < 0.5;
      const mediaTime = playback.time + (active ? Math.min(age, 0.3) : 0);
      const reaction = authoredReaction(mediaTime, active);
      specimen.update(
        delta,
        motionRef.current,
        false,
        reaction.bass * 0.58,
        reaction.accent * 0.42,
        reaction.shimmer * 0.55,
        pointerX * 0.55,
        pointerY * 0.55,
      );
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(renderer.domElement);
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    resize();
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      specimen.object.geometry.dispose();
      const materials = Array.isArray(specimen.object.material)
        ? specimen.object.material
        : [specimen.object.material];
      for (const material of materials) material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="background-artwork"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
