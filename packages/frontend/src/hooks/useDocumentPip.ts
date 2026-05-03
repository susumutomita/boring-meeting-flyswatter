import { useEffect, useRef, useState } from 'react';

type DocumentPipApi = {
  requestWindow: (options?: {
    width?: number;
    height?: number;
  }) => Promise<Window>;
};

type DocumentPipWindow = {
  documentPictureInPicture?: DocumentPipApi;
};

type UseDocumentPipArgs = {
  enabled: boolean;
  width?: number;
  height?: number;
  onClose?: () => void;
};

type UseDocumentPipReturn = {
  pipWindow: Window | null;
  isSupported: boolean;
  error: Error | null;
};

const getApi = (): DocumentPipApi | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const candidate = window as unknown as DocumentPipWindow;
  return candidate.documentPictureInPicture ?? null;
};

const cloneStyles = (sourceDoc: Document, targetDoc: Document) => {
  const styleNodes = sourceDoc.querySelectorAll(
    'link[rel="stylesheet"], style'
  );
  for (const node of Array.from(styleNodes)) {
    const cloned = node.cloneNode(true) as HTMLElement;
    targetDoc.head.appendChild(cloned);
  }
};

export const useDocumentPip = ({
  enabled,
  width = 220,
  height = 160,
  onClose,
}: UseDocumentPipArgs): UseDocumentPipReturn => {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const api = getApi();
  const isSupported = api !== null;

  useEffect(() => {
    if (!enabled || !api) {
      return undefined;
    }

    let cancelled = false;
    let openedWindow: Window | null = null;

    const open = async () => {
      try {
        const win = await api.requestWindow({ width, height });
        if (cancelled) {
          win.close();
          return;
        }
        cloneStyles(document, win.document);
        win.document.body.classList.add('pip-body');
        openedWindow = win;
        setPipWindow(win);

        const handleUnload = () => {
          setPipWindow(null);
          onCloseRef.current?.();
        };
        win.addEventListener('pagehide', handleUnload, { once: true });
      } catch (caught) {
        const normalised =
          caught instanceof Error ? caught : new Error(String(caught));
        setError(normalised);
        setPipWindow(null);
      }
    };

    open();

    return () => {
      cancelled = true;
      if (openedWindow && !openedWindow.closed) {
        openedWindow.close();
      }
      setPipWindow(null);
    };
  }, [enabled, api, width, height]);

  return { pipWindow, isSupported, error };
};
