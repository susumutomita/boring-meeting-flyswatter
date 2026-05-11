import { useEffect, useRef } from 'react';

const butoudenSequence = [
  'ArrowUp',
  'x',
  'ArrowDown',
  'b',
  'l',
  'y',
  'r',
  'a',
] as const;

type UseSecretCommandArgs = {
  enabled?: boolean;
  onTrigger: () => void;
};

export const useSecretCommand = ({
  enabled = true,
  onTrigger,
}: UseSecretCommandArgs) => {
  const onTriggerRef = useRef(onTrigger);
  const progressRef = useRef(0);

  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    if (!enabled) {
      progressRef.current = 0;
      return undefined;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const expected = butoudenSequence[progressRef.current];
      const key = expected.length === 1 ? event.key.toLowerCase() : event.key;

      if (key === expected) {
        progressRef.current += 1;
        if (progressRef.current === butoudenSequence.length) {
          progressRef.current = 0;
          onTriggerRef.current();
        }
        return;
      }

      const firstKey = butoudenSequence[0];
      progressRef.current = key === firstKey ? 1 : 0;
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [enabled]);
};
