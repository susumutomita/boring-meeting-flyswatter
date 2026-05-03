import { useEffect, useRef } from 'react';

type UseMeetingTickArgs = {
  isRunning: boolean;
  isSwatting: boolean;
  onSecondTick: () => void;
  onFlyTick: () => void;
};

export const useMeetingTick = ({
  isRunning,
  isSwatting,
  onSecondTick,
  onFlyTick,
}: UseMeetingTickArgs) => {
  const onSecondRef = useRef(onSecondTick);
  const onFlyRef = useRef(onFlyTick);

  useEffect(() => {
    onSecondRef.current = onSecondTick;
  }, [onSecondTick]);

  useEffect(() => {
    onFlyRef.current = onFlyTick;
  }, [onFlyTick]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      onSecondRef.current();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning]);

  useEffect(() => {
    if (!isSwatting) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      onFlyRef.current();
    }, 90);

    return () => window.clearInterval(intervalId);
  }, [isSwatting]);
};
