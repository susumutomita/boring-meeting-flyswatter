import { useCallback } from 'react';
import { useStreamSpeechDetector } from './useStreamSpeechDetector';

type UseTabAudioActivityArgs = {
  enabled: boolean;
  onSpeech: () => void;
  onError?: (error: Error) => void;
  onCaptureEnd?: () => void;
};

type UseTabAudioActivityReturn = {
  isCapturing: boolean;
  levelDb: number;
};

const acquireTabStream = async (): Promise<MediaStream> => {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('このブラウザはタブ音声共有に対応していません');
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: true,
  });

  if (stream.getAudioTracks().length === 0) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    throw new Error(
      '音声共有が許可されませんでした。共有ダイアログで「タブの音声も共有」を ON にしてください'
    );
  }

  for (const videoTrack of stream.getVideoTracks()) {
    videoTrack.stop();
    stream.removeTrack(videoTrack);
  }

  return stream;
};

export const useTabAudioActivity = ({
  enabled,
  onSpeech,
  onError,
  onCaptureEnd,
}: UseTabAudioActivityArgs): UseTabAudioActivityReturn => {
  const acquireStream = useCallback(() => acquireTabStream(), []);
  return useStreamSpeechDetector({
    enabled,
    acquireStream,
    onSpeech,
    onError,
    onCaptureEnd,
  });
};
