import { useEffect, useRef } from 'react';

type UseBoredomNotificationArgs = {
  enabled: boolean;
  isSwatting: boolean;
  title?: string;
  body?: string;
};

const ensurePermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
};

export const useBoredomNotification = ({
  enabled,
  isSwatting,
  title = '退屈ポイント検知',
  body = '会議が 60 秒静まりました。クリックで戻ってハエを叩く。',
}: UseBoredomNotificationArgs) => {
  const previousSwattingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      previousSwattingRef.current = isSwatting;
      return;
    }
    void ensurePermission();
    previousSwattingRef.current = isSwatting;
  }, [enabled, isSwatting]);

  useEffect(() => {
    if (!enabled) {
      previousSwattingRef.current = isSwatting;
      return;
    }
    const wasSwatting = previousSwattingRef.current;
    previousSwattingRef.current = isSwatting;

    if (wasSwatting || !isSwatting) {
      return;
    }
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }
    if (Notification.permission !== 'granted') {
      return;
    }
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible'
    ) {
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        tag: 'bmf-boredom',
      });
      notification.addEventListener('click', () => {
        window.focus();
        notification.close();
      });
    } catch {
      // ignore notification creation failures
    }
  }, [enabled, isSwatting, title, body]);
};
