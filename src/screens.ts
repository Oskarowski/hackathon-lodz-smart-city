// Registers every design file and describes the screens from the canvas index.
import canvas from '../design/canvas.json';
import { registerModule, type DcModule } from './dc/runtime';

const files = import.meta.glob<DcModule>('../design/*.dc.html', { eager: true });
for (const [path, mod] of Object.entries(files)) {
  registerModule(path.split('/').pop()!.replace(/\.dc\.html$/, ''), mod);
}

export interface Screen {
  name: string;
  title: string;
  /** Fluid page (panels) rather than a 390×844 phone screen. */
  page: boolean;
  group: string;
}

export const ENTRY = 'Main';

interface Board {
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  expand?: string;
}
interface Note {
  x: number;
  y: number;
  text: string;
  kind?: string;
}

const boards = canvas.boards as Record<string, Board>;
const headings = (Object.values(canvas.notes) as Note[])
  .filter((n) => n.kind === 'title1')
  .sort((a, b) => a.y - b.y);

const groupOf = (b: Board) => headings.filter((n) => n.y <= b.y).pop()?.text ?? 'Inne';

export const screens: Screen[] = Object.entries(boards)
  .filter(([, b]) => !b.title?.startsWith('Komponent'))
  .sort(([, a], [, b]) => a.y - b.y || a.x - b.x)
  .map(([file, b]) => ({
    name: file.replace(/\.dc\.html$/, ''),
    title: (b.title ?? file).replace(/^[\w]+ · /, ''),
    page: b.expand === 'fill',
    group: groupOf(b),
  }));

export const screenByName = new Map(screens.map((s) => [s.name, s]));

export const groups = [...new Set(screens.map((s) => s.group))].map((name) => ({
  name,
  screens: screens.filter((s) => s.group === name),
}));
