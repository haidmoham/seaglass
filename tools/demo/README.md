# Ten-second social demo

A local-only recording page that composes the real starfield and storm renderers.
The result is silent. Text uses Barlow Condensed 500 and DM Sans 500.
The sequence moves from a framed world into the storm, then closes with the URL.
It does not depict measured audio analysis or capture YouTube audio.

From the repository root:

```powershell
node tools/demo/serve.mjs C:/Users/haidm/Desktop/design/seaglass-demo
```

Open `http://127.0.0.1:5175/tools/demo/index.html` and press Record. The loopback
server accepts only the recording page origin and writes `capture.webm` to the
output directory. Close the server after recording. Then run in that directory:

```powershell
ffmpeg -i capture.webm -vf "fps=30,scale=1080:1350:flags=lanczos,tpad=stop_mode=clone:stop_duration=1" -t 10 -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart seaglass-demo-10s.mp4
```

The delivery is H.264, 1080x1350, 30 fps, exactly 10 seconds. Generated media stays
outside Git. The local recording endpoint is not part of the production app.
