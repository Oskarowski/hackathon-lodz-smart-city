// Registers every design file and describes the screens from the canvas index.
import canvas from '../design/canvas.json';
import { registerModule, type DcModule, type DcNode } from './dc/runtime';

const files = import.meta.glob<DcModule>('../design/*.dc.html', { eager: true });
for (const [path, mod] of Object.entries(files)) {
  registerModule(path.split('/').pop()!.replace(/\.dc\.html$/, ''), mod);
}

const PRIMARY = '#1D5FA8';

export interface Screen {
  name: string;
  title: string;
  /** Fluid page (staff panels) rather than a phone-sized screen. */
  page: boolean;
  group: string;
  /** Colours behind the status bar and the home indicator in standalone mode. */
  top: string;
  bottom: string;
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

type DcElement = Exclude<DcNode, string>;

function walk(nodes: DcNode[], visit: (node: DcElement) => void) {
  for (const node of nodes) {
    if (typeof node === 'string') continue;
    visit(node);
    walk(node.c, visit);
  }
}

/** A screen's own header/tab bar decide what shows behind the device insets. */
function edgeColours(name: string): { top: string; bottom: string } {
  const mod = files[`../design/${name}.dc.html`];
  const root = mod?.tree.find((n): n is DcElement => typeof n !== 'string');
  const background = (root?.a.style as Record<string, string> | undefined)?.background ?? '#FFFFFF';
  let header = false;
  let tabs = false;
  if (mod) {
    walk(mod.tree, (node) => {
      if (node.t !== 'dc-import') return;
      if (node.a.name === 'Naglowek') header = true;
      if (node.a.name === 'PasekZakladek') tabs = true;
    });
  }
  return { top: header ? PRIMARY : background, bottom: tabs ? '#FFFFFF' : background };
}

const boards = canvas.boards as Record<string, Board>;
const headings = (Object.values(canvas.notes) as Note[])
  .filter((n) => n.kind === 'title1')
  .sort((a, b) => a.y - b.y);

const groupOf = (b: Board) => headings.filter((n) => n.y <= b.y).pop()?.text ?? 'Inne';

export const screens: Screen[] = Object.entries(boards)
  .filter(([, b]) => !b.title?.startsWith('Komponent'))
  .sort(([, a], [, b]) => a.y - b.y || a.x - b.x)
  .map(([file, b]) => {
    const name = file.replace(/\.dc\.html$/, '');
    return {
      name,
      title: (b.title ?? file).replace(/^[\w]+ · /, ''),
      page: b.expand === 'fill',
      group: groupOf(b),
      ...edgeColours(name),
    };
  });

export const screenByName = new Map(screens.map((s) => [s.name, s]));

export const groups = [...new Set(screens.map((s) => s.group))].map((name) => ({
  name,
  screens: screens.filter((s) => s.group === name),
}));
