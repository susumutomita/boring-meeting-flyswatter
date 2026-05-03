import { useEffect, useRef, useState } from 'react';
import {
  computeRmsDecibels,
  isSpeechSample,
  minSpeechIntervalMs,
  speechSustainSamples,
} from '../lib/audio';

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

const captureMeetingTab = async (): Promise<MediaStream> => {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('このブラウザはタブ音声共有に対応していません');
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: {
      displaySurface: 'browser',
    },
  });

  if (stream.getAudioTracks().length === 0) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    throw new Error('音声共有が許可されませんでした');
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
  const [isCapturing, setIsCapturing] = useState(false);
  const [levelDb, setLevelDb] = useState(Number.NEGATIVE_INFINITY);
  const onSpeechRef = useRef(onSpeech);
  const onErrorRef = useRef(onError);
  const onCaptureEndRef = useRef(onCaptureEnd);

  useEffect(() => {
    onSpeechRef.current = onSpeech;
  }, [onSpeech]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onCaptureEndRef.current = onCaptureEnd;
  }, [onCaptureEnd]);

  useEffect(() => {
    if (!enabled) {
      setLevelDb(Number.NEGATIVE_INFINITY);
      setIsCapturing(false);
      return undefined;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let rafId: number | null = null;

    const teardown = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (audioContext) {
        audioContext.close().catch(() => {});
        audioContext = null;
      }
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        stream = null;
      }
    };

    const start = async () => {
      try {
        stream = await captureMeetingTab();
        if (cancelled) {
          teardown();
          return;
        }

        const ContextCtor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioContext = new ContextCtor();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);

        const buffer = new Float32Array(analyser.fftSize);
        const recent: number[] = [];
        let lastFireMs = 0;

        const tick = () => {
          if (cancelled) {
            return;
          }
          analyser.getFloatTimeDomainData(buffer);
          const decibels = computeRmsDecibels(buffer);
          setLevelDb(decibels);
          recent.push(decibels);
          while (recent.length > speechSustainSamples) {
            recent.shift();
          }

          if (isSpeechSample(recent)) {
            const now =
              typeof performance !== 'undefined'
                ? performance.now()
                : Date.now();
            if (now - lastFireMs >= minSpeechIntervalMs) {
              lastFireMs = now;
              onSpeechRef.current();
            }
          }

          rafId = requestAnimationFrame(tick);
        };

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.addEventListener('ended', () => {
            cancelled = true;
            teardown();
            setIsCapturing(false);
            setLevelDb(Number.NEGATIVE_INFINITY);
            onCaptureEndRef.current?.();
          });
        }

        setIsCapturing(true);
        tick();
      } catch (error) {
        const normalisedError =
          error instanceof Error ? error : new Error(String(error));
        onErrorRef.current?.(normalisedError);
        cancelled = true;
        teardown();
        setIsCapturing(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      teardown();
      setIsCapturing(false);
    };
  }, [enabled]);

  return { isCapturing, levelDb };
};
