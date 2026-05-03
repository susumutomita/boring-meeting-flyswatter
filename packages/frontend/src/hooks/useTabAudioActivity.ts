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

type ExtendedDisplayMediaOptions = DisplayMediaStreamOptions & {
  systemAudio?: 'include' | 'exclude';
  selfBrowserSurface?: 'include' | 'exclude';
  surfaceSwitching?: 'include' | 'exclude';
  preferCurrentTab?: boolean;
};

const describeShareTarget = (stream: MediaStream): string => {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) {
    return '';
  }
  const settings = videoTrack.getSettings() as MediaTrackSettings & {
    displaySurface?: string;
  };
  switch (settings.displaySurface) {
    case 'browser':
      return 'ブラウザのタブ';
    case 'window':
      return 'アプリのウィンドウ';
    case 'monitor':
      return '画面全体';
    default:
      return '共有元';
  }
};

const acquireTabStream = async (): Promise<MediaStream> => {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('このブラウザはタブ音声共有に対応していません');
  }

  const options: ExtendedDisplayMediaOptions = {
    audio: true,
    video: { displaySurface: 'browser' },
    systemAudio: 'include',
    selfBrowserSurface: 'exclude',
    surfaceSwitching: 'include',
    preferCurrentTab: false,
  };

  const stream = await navigator.mediaDevices.getDisplayMedia(options);

  if (stream.getAudioTracks().length === 0) {
    const target = describeShareTarget(stream);
    for (const track of stream.getTracks()) {
      track.stop();
    }
    if (target === 'ブラウザのタブ') {
      throw new Error(
        '共有ダイアログ下部の「タブの音声も共有 ( Also share tab audio )」を ON にしてから「共有」を押してください'
      );
    }
    throw new Error(
      `${target}の共有では音声を取れません。「Chrome タブ」を選んで「タブの音声も共有」を ON にするか、マイク検知に切り替えてください`
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
