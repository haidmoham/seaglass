export type DecodedPcm = Readonly<{
  samples: Float32Array;
  sampleRate: number;
}>;

export const decodeAudioFile = async (
  file: File,
  audioContext: AudioContext,
): Promise<DecodedPcm> => {
  const encodedAudio = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(encodedAudio);
  const samples = new Float32Array(audioBuffer.length);

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const channelSamples = audioBuffer.getChannelData(channel);
    for (let index = 0; index < channelSamples.length; index += 1) {
      samples[index] += channelSamples[index] / audioBuffer.numberOfChannels;
    }
  }

  return { samples, sampleRate: audioBuffer.sampleRate };
};
