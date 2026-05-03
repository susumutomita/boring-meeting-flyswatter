import { useEffect, useRef, useState } from 'react';
import {
  computeRmsDecibels,
  isSpeechSample,
  minSpeechIntervalMs,
  speechSustainSamples,
} from '../lib/audio';

type UseStreamSpeechDetectorArgs = {
  enabled: boolean;
  acquireStream: () => Promise<MediaStream>;
  onSpeech: () => void;
  onError?: (error: Error) => void;
  onCaptureEnd?: () => void;
};

type UseStreamSpeechDetectorReturn = {
  isCapturing: boolean;
  levelDb: number;
};

const buildAudioContext = (): AudioContext => {
  const ContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  return new ContextCtor();
};

export const useStreamSpeechDetector = ({
  enabled,
  acquireStream,
  onSpeech,
  onError,
  onCaptureEnd,
}: UseStreamSpeechDetectorArgs): UseStreamSpeechDetectorReturn => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [levelDb, setLevelDb] = useState(Number.NEGATIVE_INFINITY);
  const acquireStreamRef = useRef(acquireStream);
  const onSpeechRef = useRef(onSpeech);
  const onErrorRef = useRef(onError);
  const onCaptureEndRef = useRef(onCaptureEnd);

  useEffect(() => {
    acquireStreamRef.current = acquireStream;
  }, [acquireStream]);

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
        stream = await acquireStreamRef.current();
        if (cancelled) {
          teardown();
          return;
        }

        audioContext = buildAudioContext();
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
