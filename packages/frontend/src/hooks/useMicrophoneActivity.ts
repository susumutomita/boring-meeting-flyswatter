import { useCallback } from 'react';
import { useStreamSpeechDetector } from './useStreamSpeechDetector';

type UseMicrophoneActivityArgs = {
  enabled: boolean;
  onSpeech: () => void;
  onError?: (error: Error) => void;
  onCaptureEnd?: () => void;
};

type UseMicrophoneActivityReturn = {
  isCapturing: boolean;
  levelDb: number;
};

const acquireMicStream = async (): Promise<MediaStream> => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('このブラウザはマイク入力に対応していません');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });

  if (stream.getAudioTracks().length === 0) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    throw new Error('マイクの利用が許可されませんでした');
  }

  return stream;
};

export const useMicrophoneActivity = ({
  enabled,
  onSpeech,
  onError,
  onCaptureEnd,
}: UseMicrophoneActivityArgs): UseMicrophoneActivityReturn => {
  const acquireStream = useCallback(() => acquireMicStream(), []);
  return useStreamSpeechDetector({
    enabled,
    acquireStream,
    onSpeech,
    onError,
    onCaptureEnd,
  });
};
