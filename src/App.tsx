import { useEffect, useState, useSyncExternalStore } from 'react';
import { getComponent, getModule } from './dc/runtime';
import { ENTRY, groups, screenByName } from './screens';
import { useInstallPrompt } from './install';

const PICKER = 'ekrany';
const PHONE_W = 390;
const PHONE_H = 844;

function readRoute() {
  const name = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  if (name === PICKER) return PICKER;
  return screenByName.has(name) ? name : ENTRY;
}

function useRoute() {
  return useSyncExternalStore(
    (cb) => {
      addEventListener('hashchange', cb);
      return () => removeEventListener('hashchange', cb);
    },
    readRoute,
  );
}

function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => matchMedia(query).matches,
  );
}

function useViewportHeight() {
  return useSyncExternalStore(
    (cb) => {
      addEventListener('resize', cb);
      return () => removeEventListener('resize', cb);
    },
    () => innerHeight,
  );
}

function ScreenView({ name }: { name: string }) {
  const Screen = getComponent(name);
  useEffect(() => {
    document.title = getModule(name)?.title || 'Moje Osiedle';
    scrollTo(0, 0);
  }, [name]);
  return Screen ? <Screen key={name} /> : null;
}

function Picker({ current, onPick }: { current: string; onPick?: () => void }) {
  const install = useInstallPrompt();
  return (
    <nav className="picker" aria-label="Ekrany prezentacji">
      <div className="picker-head">
        <span className="picker-brand">
          Moje Osiedle<span className="picker-dot">.</span>
        </span>
        <span className="picker-sub">Prototyp · wybierz ekran</span>
        {install && (
          <button type="button" className="picker-install" onClick={install}>
            Zainstaluj aplikację
          </button>
        )}
      </div>
      {groups.map((g) => (
        <section key={g.name}>
          <h2>{g.name}</h2>
          <ul>
            {g.screens.map((s) => (
              <li key={s.name}>
                <a href={`#/${s.name}`} aria-current={s.name === current ? 'page' : undefined} onClick={onPick}>
                  {s.title}
                  {s.page && <span className="picker-tag">panel</span>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

export default function App() {
  const route = useRoute();
  const narrow = useMedia('(max-width: 600px)');
  const vh = useViewportHeight();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => setDrawer(false), [route]);

  if (route === PICKER) {
    return (
      <div className="picker-page">
        <Picker current={PICKER} />
      </div>
    );
  }

  const screen = screenByName.get(route)!;

  if (screen.page) {
    return (
      <>
        <div className="page-fill">
          <ScreenView name={route} />
        </div>
        <button type="button" className="picker-fab" aria-expanded={drawer} onClick={() => setDrawer(!drawer)}>
          Ekrany
        </button>
        {drawer && (
          <div className="picker-drawer" onClick={(e) => e.target === e.currentTarget && setDrawer(false)}>
            <Picker current={route} onPick={() => setDrawer(false)} />
          </div>
        )}
      </>
    );
  }

  if (narrow) {
    return (
      <div className="phone-fill mobile">
        <ScreenView name={route} />
      </div>
    );
  }

  const scale = Math.min(1, (vh - 48) / (PHONE_H + 24));
  return (
    <div className="desk">
      <Picker current={route} />
      <main className="stage">
        <div className="phone" style={{ width: (PHONE_W + 24) * scale, height: (PHONE_H + 24) * scale }}>
          <div className="phone-body" style={{ transform: `scale(${scale})` }}>
            <div className="phone-fill">
              <ScreenView name={route} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
