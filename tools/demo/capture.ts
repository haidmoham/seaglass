import * as THREE from "three";
import { createStormScene } from "../../src/scene/storm-scene";
import { createStarfield } from "../../src/scene/starfield";

const output = document.querySelector<HTMLCanvasElement>("#output")!;
const stormCanvas = document.querySelector<HTMLCanvasElement>("#storm")!;
const button = document.querySelector<HTMLButtonElement>("#record")!;
const status = document.querySelector<HTMLElement>("#status")!;
const context = output.getContext("2d")!;
const stars = new THREE.WebGLRenderer({ antialias: true });
stars.setSize(1080, 1350);
stars.outputColorSpace = THREE.SRGBColorSpace;
const starScene = new THREE.Scene();
const field = createStarfield(86);
field.resize(1080 / 1350);
starScene.add(field.object);
const camera = new THREE.Camera();
const storm = createStormScene(stormCanvas);
storm.setIntensity(1.15);
storm.setWeather("storm");
const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
function text(value: string, x: number, y: number, size: number, alpha = 1) {
  context.globalAlpha = alpha;
  context.fillStyle = "#fff5e7";
  context.font = `500 ${size}px "Barlow Condensed"`;
  context.fillText(value, x, y);
  context.globalAlpha = 1;
}
function draw(time: number, delta: number) {
  field.update(delta, true, 0.12, 0.1, 0.2, Math.sin(time * 0.4), 0.1, true);
  stars.render(starScene, camera);
  context.drawImage(stars.domElement, 0, 0);
  const zoom = ease((time - 2.2) / 1.8);
  const x = 64 * (1 - zoom);
  const y = 490 * (1 - zoom);
  const width = 952 + 128 * zoom;
  const height = 780 + 570 * zoom;
  const sourceWidth = stormCanvas.width;
  const sourceHeight = Math.min(stormCanvas.height, sourceWidth * height / width);
  const sourceY = (stormCanvas.height - sourceHeight) * 0.5;
  context.drawImage(stormCanvas, 0, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  context.strokeStyle = "#b5e7df";
  context.lineWidth = 2;
  context.globalAlpha = 1 - zoom;
  context.strokeRect(x, y, width, height);
  context.globalAlpha = 1;
  text("just hit", 64, 218, 200, 1 - zoom);
  text("play", 64, 395, 200, 1 - zoom);
  storm.setImmersive(time > 3.3);
  storm.setPlayback(88 + time, true);
  storm.setEnergy(0.4 + 0.25 * Math.sin(time * 1.4));
  const caption = ease((time - 4) / 0.6) * (1 - ease((time - 6.8) / 0.7));
  context.fillStyle = "#03111c";
  context.globalAlpha = caption * 0.3;
  context.fillRect(0, 0, 1080, 1350);
  context.globalAlpha = 1;
  text("enter the", 64, 1040, 125, caption);
  text("weather", 64, 1150, 125, caption);
  const ending = ease((time - 7.8) / 0.8);
  context.fillStyle = "#040b18";
  context.globalAlpha = ending * 0.75;
  context.fillRect(0, 0, 1080, 1350);
  context.globalAlpha = 1;
  text("sea glass", 64, 670, 185, ending);
  context.globalAlpha = ending;
  context.font = '500 35px "DM Sans"';
  context.fillText("seaglass.shin86.dev", 72, 748);
  context.globalAlpha = 1;
}
button.addEventListener("click", async () => {
  button.disabled = true;
  await document.fonts.load('500 200px "Barlow Condensed"');
  await document.fonts.load('500 35px "DM Sans"');
  storm.resetCamera();
  storm.setImmersive(false);
  const stream = output.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9" : "video/webm;codecs=vp8";
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000 });
  const chunks: Blob[] = [];
  recorder.addEventListener("dataavailable", event => chunks.push(event.data));
  recorder.addEventListener("stop", async () => {
    for (const track of stream.getTracks()) track.stop();
    const response = await fetch("/save-recording", {
      method: "POST", body: new Blob(chunks, { type: mimeType }),
    });
    status.textContent = response.ok ? "saved · 10 seconds" : "save failed";
    button.disabled = false;
  });
  let started = 0;
  let previous = 0;
  function frame(now: number) {
    if (!started) { started = now; previous = now; recorder.start(); }
    const time = (now - started) / 1000;
    draw(Math.min(time, 10), Math.min((now - previous) / 1000, 0.05));
    previous = now;
    status.textContent = `recording · ${Math.min(10, time).toFixed(1)}s`;
    if (time < 10) requestAnimationFrame(frame);
    else recorder.stop();
  }
  requestAnimationFrame(frame);
});
