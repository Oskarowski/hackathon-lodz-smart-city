// Vite plugin: compiles the design canvas files (`design/*.dc.html`) into ES modules
// the runtime in `src/dc/runtime.tsx` renders with React.
//
// A compiled module exports:
//   title   – the screen's <title>
//   props   – the parsed `data-props` declaration (defaults for tweaks)
//   styles  – CSS text from <helmet><style> blocks
//   tree    – the <x-dc> template as JSON nodes (see `DcNode` in src/dc/runtime.tsx)
//   define  – (DCLogic) => Component, the screen's logic class
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';
import type { Plugin } from 'vite';
import { parseStyle } from '../src/dc/style.ts';

type P5Node = {
  nodeName: string;
  tagName?: string;
  namespaceURI?: string;
  attrs?: { name: string; value: string }[];
  childNodes?: P5Node[];
  content?: P5Node;
  value?: string;
};

type DcNode = string | { t: string; a: Record<string, unknown>; c: DcNode[] };

const SVG_NS = 'http://www.w3.org/2000/svg';
const HOLE = /\{\{/;

// HTML attribute names React wants in camelCase.
const ATTR_MAP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  inputmode: 'inputMode',
  enterkeyhint: 'enterKeyHint',
  crossorigin: 'crossOrigin',
  srcset: 'srcSet',
  contenteditable: 'contentEditable',
  novalidate: 'noValidate',
  accesskey: 'accessKey',
  datetime: 'dateTime',
  enctype: 'encType',
  formaction: 'formAction',
  usemap: 'useMap',
  'accept-charset': 'acceptCharset',
  'http-equiv': 'httpEquiv',
};

// parse5 lowercases attribute names, so `onClick` arrives as `onclick`.
const EVENTS = [
  'Click', 'DoubleClick', 'Change', 'Input', 'Submit', 'KeyDown', 'KeyUp', 'KeyPress',
  'Focus', 'Blur', 'MouseDown', 'MouseUp', 'MouseEnter', 'MouseLeave', 'MouseOver',
  'MouseOut', 'PointerDown', 'PointerUp', 'PointerEnter', 'PointerLeave', 'TouchStart',
  'TouchEnd', 'Scroll', 'Load', 'Error', 'ContextMenu', 'AnimationEnd', 'TransitionEnd',
];
const EVENT_MAP: Record<string, string> = Object.fromEntries(
  EVENTS.map((e) => ['on' + e.toLowerCase(), 'on' + e]),
);
EVENT_MAP.ondblclick = 'onDoubleClick';

// Containers in which whitespace-only text nodes are invalid for React.
const NO_WHITESPACE = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup', 'select', 'x-dc']);

const camel = (s: string) => s.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

function attrName(name: string, isSvg: boolean): string {
  if (name.startsWith('aria-') || name.startsWith('data-') || name.startsWith('hint-')) return name;
  if (EVENT_MAP[name]) return EVENT_MAP[name];
  if (ATTR_MAP[name]) return ATTR_MAP[name];
  if (isSvg) {
    if (name === 'xlink:href') return 'xlinkHref';
    if (name === 'xml:space') return 'xmlSpace';
    return camel(name);
  }
  return name;
}

function textOf(node: P5Node): string {
  if (node.nodeName === '#text') return node.value ?? '';
  return (node.childNodes ?? []).map(textOf).join('');
}

function find(node: P5Node, tag: string): P5Node | undefined {
  if (node.tagName === tag) return node;
  for (const child of node.childNodes ?? []) {
    const hit = find(child, tag);
    if (hit) return hit;
  }
  return undefined;
}

function findAll(node: P5Node, pred: (n: P5Node) => boolean, out: P5Node[] = []): P5Node[] {
  if (pred(node)) out.push(node);
  for (const child of node.childNodes ?? []) findAll(child, pred, out);
  return out;
}

function convert(node: P5Node, parentTag: string, styles: string[]): DcNode | null {
  if (node.nodeName === '#comment') return null;
  if (node.nodeName === '#text') {
    const v = node.value ?? '';
    if (!v.trim() && NO_WHITESPACE.has(parentTag)) return null;
    return v;
  }
  const tag = node.tagName!;
  if (tag === 'helmet') {
    // Font <link>s are replaced by the self-hosted Montserrat in src/main.tsx.
    for (const s of findAll(node, (n) => n.tagName === 'style')) styles.push(textOf(s));
    return null;
  }
  const isSvg = node.namespaceURI === SVG_NS;
  const a: Record<string, unknown> = {};
  for (const { name, value } of node.attrs ?? []) {
    const key = attrName(name, isSvg);
    a[key] = key === 'style' && !HOLE.test(value) ? parseStyle(value) : value;
  }
  let children = node.childNodes ?? [];

  if (tag === 'textarea') {
    const text = textOf(node).replace(/^\n/, '');
    if (text && a.value === undefined) a.defaultValue = text;
    children = [];
  }
  if (tag === 'select' && a.value === undefined) {
    const selected = findAll(node, (n) => n.tagName === 'option' && !!n.attrs?.some((x) => x.name === 'selected'))[0];
    if (selected) a.defaultValue = selected.attrs!.find((x) => x.name === 'value')?.value ?? textOf(selected);
  }
  if (tag === 'option') delete a.selected;

  const c: DcNode[] = [];
  for (const child of tag === 'template' ? node.content?.childNodes ?? [] : children) {
    const out = convert(child, tag, styles);
    if (out !== null) c.push(out);
  }
  return { t: tag, a, c };
}

export function compileDc(source: string, id: string): string {
  const doc = parse(source) as unknown as P5Node;
  const root = find(doc, 'x-dc');
  if (!root) throw new Error(`${id}: no <x-dc> element`);
  const script = findAll(doc, (n) => n.tagName === 'script' && !!n.attrs?.some((x) => x.name === 'data-dc-script'))[0];
  const title = textOf(find(doc, 'title') ?? { nodeName: '#text', value: '' }).trim();
  const propsAttr = script?.attrs?.find((x) => x.name === 'data-props')?.value ?? '{}';
  let props: unknown = {};
  try {
    props = JSON.parse(propsAttr);
  } catch (e) {
    throw new Error(`${id}: invalid data-props JSON: ${(e as Error).message}`);
  }
  const code = script ? textOf(script) : 'class Component extends DCLogic {}';

  const styles: string[] = [];
  const tree: DcNode[] = [];
  for (const child of root.childNodes ?? []) {
    const out = convert(child, 'x-dc', styles);
    if (out !== null) tree.push(out);
  }

  return [
    `export const title = ${JSON.stringify(title)};`,
    `export const props = ${JSON.stringify(props)};`,
    `export const styles = ${JSON.stringify(styles)};`,
    `export const tree = ${JSON.stringify(tree)};`,
    `export function define(DCLogic) {\n${code}\nreturn Component;\n}`,
  ].join('\n');
}

// Design files are served under a virtual id so Vite's own HTML handling leaves them alone.
const PREFIX = '\0dc:';
const SUFFIX = '.js';

export default function dcPlugin(): Plugin {
  let root = process.cwd();
  return {
    name: 'moje-osiedle:dc-html',
    enforce: 'pre',
    configResolved(config) {
      root = config.root;
    },
    resolveId(source, importer) {
      if (!source.endsWith('.dc.html')) return null;
      if (source.startsWith('/') && !source.startsWith(root)) return PREFIX + path.join(root, source) + SUFFIX;
      return PREFIX + (path.isAbsolute(source) ? source : path.resolve(path.dirname(importer ?? root), source)) + SUFFIX;
    },
    async load(id) {
      if (!id.startsWith(PREFIX)) return null;
      const file = id.slice(PREFIX.length, -SUFFIX.length);
      this.addWatchFile(file);
      return compileDc(await readFile(file, 'utf8'), file);
    },
  };
}
