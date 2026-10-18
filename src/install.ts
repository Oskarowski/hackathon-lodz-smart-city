interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

let deferred: BeforeInstallPromptEvent | null = null;

addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
});
addEventListener('appinstalled', () => {
  deferred = null;
});

const standalone = () =>
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * Triggers the browser's install dialog when it offers one, and returns a line
 * for the app to show — the install action lives on the "Więcej" screen.
 */
export function installMessage(): string {
  if (standalone()) return 'Aplikacja jest już zainstalowana.';
  if (deferred) {
    deferred.prompt();
    deferred = null;
    return 'Otwieramy okno instalacji.';
  }
  if (isIos()) return 'W Safari: Udostępnij → „Dodaj do ekranu początkowego”.';
  return 'W menu przeglądarki wybierz „Zainstaluj aplikację”.';
}
