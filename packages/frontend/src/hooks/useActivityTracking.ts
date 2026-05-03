import { useEffect, useRef } from 'react';

type UseActivityTrackingArgs = {
  enabled: boolean;
  onActivity: (label: string) => void;
};

export const useActivityTracking = ({
  enabled,
  onActivity,
}: UseActivityTrackingArgs) => {
  const onActivityRef = useRef(onActivity);

  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      onActivityRef.current('キーボード入力');
    };

    const handlePointerdown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-no-activity-capture="true"]')) {
        return;
      }
      onActivityRef.current('ポインター操作');
    };

    const handleInput = () => {
      onActivityRef.current('入力を検知');
    };

    const handleFocus = () => {
      onActivityRef.current('ページに戻った');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onActivityRef.current('タブに戻った');
      }
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('pointerdown', handlePointerdown);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('input', handleInput, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('pointerdown', handlePointerdown);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('input', handleInput, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);
};
