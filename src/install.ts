import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
  listeners.forEach((l) => l());
});
addEventListener('appinstalled', () => {
  deferred = null;
  listeners.forEach((l) => l());
});

/** Returns a function that shows the browser's install dialog, when the browser offers one. */
export function useInstallPrompt(): (() => void) | null {
  const [, rerender] = useState(0);
  useEffect(() => {
    const l = () => rerender((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  if (!deferred) return null;
  return () => {
    deferred?.prompt();
    deferred = null;
  };
}
