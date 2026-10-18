// Development-only screen index (`#/ekrany`), for jumping straight to a screen
// while working on the design. It is not part of the production build.
import { groups } from './screens';

export default function DevIndex() {
  return (
    <nav className="dev-index" aria-label="Ekrany">
      <h1>Ekrany makiety</h1>
      <p>Widok deweloperski — nie wchodzi do wersji produkcyjnej.</p>
      {groups.map((g) => (
        <section key={g.name}>
          <h2>{g.name}</h2>
          <ul>
            {g.screens.map((s) => (
              <li key={s.name}>
                <a href={`#/${s.name}`}>{s.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
