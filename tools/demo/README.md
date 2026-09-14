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

## Add real playback audio

When music is wanted, record playback through Windows WASAPI loopback. This captures
system output, not a microphone. Start only with authorization to record system
audio, and keep unrelated sounds out of the take. Play the selected track through
the normal player, capture a little over ten seconds, then pause playback.

`capture-system-audio.ps1` uses NAudio.Core and NAudio.Wasapi 2.2.1 from NuGet.
Extract their packages into a local library directory, retaining the package names
and `lib/netstandard2.0/` paths. Libraries and media stay outside the repository.

```powershell
pwsh -NoProfile -File tools/demo/capture-system-audio.ps1 -OutputPath C:/path/system-audio.wav -LibraryRoot C:/path/audio-tools
ffmpeg -i system-audio.wav -af volumedetect -f null NUL
ffmpeg -i seaglass-demo-10s.mp4 -ss 0.5 -i system-audio.wav -map 0:v:0 -map 1:a:0 -c:v copy -af "atrim=duration=10,asetpts=PTS-STARTPTS,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.08,afade=t=out:st=9.5:d=0.5" -c:a aac -b:a 192k -ar 48000 -t 10 -movflags +faststart seaglass-demo-10s-with-music.mp4
```

Verify the final file with ffprobe and a complete FFmpeg decode. Check the audio
signal, fades, and representative frames. The delivered cut was 10.000 seconds,
1080x1350 H.264 with stereo AAC at 48 kHz. Music was recorded from system playback.
Creating the demo does not publish it or establish rights for a social post.
