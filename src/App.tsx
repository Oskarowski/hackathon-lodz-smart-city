import { useEffect, useSyncExternalStore, type CSSProperties } from 'react';
import { getComponent, getModule } from './dc/runtime';
import { ENTRY, screenByName } from './screens';
import { installMessage } from './install';
import DevIndex from './DevIndex';

const DEV_INDEX = 'ekrany';

function readRoute() {
  const name = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  if (import.meta.env.DEV && name === DEV_INDEX) return DEV_INDEX;
  return screenByName.has(name) ? name : ENTRY;
}

function useRoute() {
  return useSyncExternalStore((cb) => {
    addEventListener('hashchange', cb);
    return () => removeEventListener('hashchange', cb);
  }, readRoute);
}

export default function App() {
  const route = useRoute();
  const screen = screenByName.get(route);

  // The app's own screens offer these actions (see the "Więcej" screen).
  useEffect(() => {
    (window as unknown as { mojeOsiedle: { install: () => string } }).mojeOsiedle = {
      install: installMessage,
    };
  }, []);

  useEffect(() => {
    document.title = getModule(route)?.title || 'Moje Osiedle';
    if (screen) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', screen.top);
    scrollTo(0, 0);
  }, [route, screen]);

  // Only the dev-only screen index has no board; this branch is dropped from the build.
  if (!screen) return import.meta.env.DEV ? <DevIndex /> : null;

  const Screen = getComponent(route)!;

  if (screen.page) {
    return (
      <div className="app app--page">
        <Screen key={route} />
      </div>
    );
  }

  return (
    <div className="app app--phone">
      <div
        className="app-screen"
        style={{ '--app-top': screen.top, '--app-bottom': screen.bottom } as CSSProperties}
      >
        <Screen key={route} />
      </div>
    </div>
  );
}
