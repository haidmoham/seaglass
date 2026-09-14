param([Parameter(Mandatory=$true)][string]$OutputPath, [Parameter(Mandatory=$true)][string]$LibraryRoot, [int]$DurationMs = 13000)
$ErrorActionPreference = 'Stop'
$library = $LibraryRoot
$core = Join-Path $library 'naudio.core/lib/netstandard2.0/NAudio.Core.dll'
$wasapi = Join-Path $library 'naudio.wasapi/lib/netstandard2.0/NAudio.Wasapi.dll'
Add-Type -Path $core
Add-Type -Path $wasapi
Add-Type -ReferencedAssemblies (@($core,$wasapi) + @(Get-ChildItem "$PSHOME/ref/*.dll" | ForEach-Object FullName)) -TypeDefinition @"
using System;
using System.Threading;
using NAudio.Wave;
public static class DemoLoopback {
  public static void Record(string path, int milliseconds) {
    using (var capture = new WasapiLoopbackCapture())
    using (var writer = new WaveFileWriter(path, capture.WaveFormat))
    using (var stopped = new ManualResetEvent(false)) {
      capture.DataAvailable += (sender, e) => writer.Write(e.Buffer, 0, e.BytesRecorded);
      capture.RecordingStopped += (sender, e) => stopped.Set();
      capture.StartRecording();
      Thread.Sleep(milliseconds);
      capture.StopRecording();
      stopped.WaitOne(3000);
    }
  }
}
"@
[DemoLoopback]::Record($OutputPath, $DurationMs)


