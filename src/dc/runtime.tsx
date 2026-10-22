// Renders compiled design files (see vite/dc-plugin.ts) as React class components.
// Implements the .dc.html template contract: {{holes}}, <sc-if>, <sc-for>,
// <dc-import>, event handlers, and links between screens (`X.dc.html` → `#/X`).
import { Component, createElement, Fragment, type ComponentType, type ReactNode } from 'react';
import { parseStyle } from './style';
import { demo } from '../demo';

export type DcNode = string | { t: string; a: Record<string, unknown>; c: DcNode[] };

export interface DcModule {
  title: string;
  props: Record<string, { default?: unknown } | undefined>;
  styles: string[];
  tree: DcNode[];
  define: (base: typeof DCLogic) => typeof DCLogic;
}

type Scope = Record<string, unknown>;

/** Available in every template as `{{$demo.…}}` and in logic as `this.demo`. */
const GLOBALS: Scope = { $demo: demo };

const WHOLE_HOLE = /^\{\{\s*([^}]*?)\s*\}\}$/;
const HOLES = /\{\{\s*([^}]*?)\s*\}\}/g;
const BOOLEAN_ATTRS = new Set([
  'disabled', 'checked', 'hidden', 'readOnly', 'required', 'multiple', 'autoFocus', 'open',
  'selected', 'noValidate', 'defaultChecked',
]);
const FORM_TAGS = new Set(['input', 'textarea', 'select']);

const modules = new Map<string, DcModule>();
const components = new Map<string, typeof DCLogic>();

export function registerModule(name: string, mod: DcModule) {
  modules.set(name, mod);
}

export function hasScreen(name: string) {
  return modules.has(name);
}

export function getModule(name: string) {
  return modules.get(name);
}

export function getComponent(name: string): ComponentType<Record<string, unknown>> | undefined {
  let cls = components.get(name);
  if (!cls) {
    const mod = modules.get(name);
    if (!mod) return undefined;
    cls = mod.define(DCLogic);
    (cls as unknown as { dc: DcModule }).dc = mod;
    (cls as unknown as { displayName: string }).displayName = name;
    components.set(name, cls);
  }
  return cls as unknown as ComponentType<Record<string, unknown>>;
}

/** `Start.dc.html` → `#/Start`; other hrefs unchanged. */
export function screenHref(href: string): string {
  const m = /^\/?(?:\.\/)?([\w.-]+?)\.dc\.html(#.*)?$/.exec(href);
  return m ? `#/${m[1]}` : href;
}

function literal(expr: string): { ok: boolean; value?: unknown } {
  if (expr === 'true') return { ok: true, value: true };
  if (expr === 'false') return { ok: true, value: false };
  if (expr === 'null') return { ok: true, value: null };
  if (expr === 'undefined' || expr === '') return { ok: true, value: undefined };
  if (/^-?\d+(\.\d+)?$/.test(expr)) return { ok: true, value: Number(expr) };
  if (/^(['"]).*\1$/.test(expr)) return { ok: true, value: expr.slice(1, -1) };
  return { ok: false };
}

function lookup(expr: string, scope: Scope): unknown {
  const lit = literal(expr);
  if (lit.ok) return lit.value;
  let value: unknown = scope;
  for (const key of expr.split('.')) {
    if (value == null) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function interpolate(text: string, scope: Scope): string {
  return text.replace(HOLES, (_, expr: string) => {
    const v = lookup(expr, scope);
    return v == null ? '' : String(v);
  });
}

/** Whole-value hole → raw value; mixed text → interpolated string. */
function attrValue(raw: unknown, scope: Scope): unknown {
  if (typeof raw !== 'string') return raw;
  const whole = WHOLE_HOLE.exec(raw);
  if (whole) return lookup(whole[1], scope);
  return raw.includes('{{') ? interpolate(raw, scope) : raw;
}

function anchorClick(href: string, onClick: unknown) {
  return (e: { preventDefault(): void }) => {
    if (typeof onClick === 'function') onClick(e);
    e.preventDefault();
    const id = href.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

function elementProps(tag: string, attrs: Record<string, unknown>, scope: Scope) {
  const props: Record<string, unknown> = {};
  for (const [name, raw] of Object.entries(attrs)) {
    if (name.startsWith('hint-')) continue;
    let v = attrValue(raw, scope);
    if (name === 'style') {
      if (typeof v === 'string') v = parseStyle(v);
    } else if (BOOLEAN_ATTRS.has(name)) {
      v = typeof raw === 'string' && !raw.includes('{{') ? raw !== 'false' : v !== 'false' && !!v;
    } else if (name.startsWith('aria-') || name.startsWith('data-')) {
      if (v == null || v === '') continue;
      if (typeof v === 'boolean') v = String(v);
    } else if (v === undefined) {
      continue;
    }
    props[name] = v;
  }

  if (tag === 'a' && typeof props.href === 'string') {
    const href = screenHref(props.href);
    props.href = href;
    if (href.startsWith('#') && !href.startsWith('#/')) props.onClick = anchorClick(href, props.onClick);
    else if (/^https?:/.test(href) && !props.target) {
      props.target = '_blank';
      props.rel = 'noopener noreferrer';
    }
  }

  // Without a change handler a form field stays editable (uncontrolled).
  if (FORM_TAGS.has(tag) && typeof props.onChange !== 'function') {
    if ('value' in props) {
      props.defaultValue = props.value;
      delete props.value;
    }
    if ('checked' in props) {
      props.defaultChecked = props.checked;
      delete props.checked;
    }
  }
  return props;
}

function renderNodes(nodes: DcNode[], scope: Scope): ReactNode[] {
  return nodes.map((node) => renderNode(node, scope));
}

function renderNode(node: DcNode, scope: Scope): ReactNode {
  if (typeof node === 'string') return node.includes('{{') ? interpolate(node, scope) : node;
  const { t: tag, a: attrs, c: children } = node;

  if (tag === 'sc-if') {
    const cond = attrValue(attrs.value, scope);
    return cond && cond !== 'false' ? createElement(Fragment, null, ...renderNodes(children, scope)) : null;
  }

  if (tag === 'sc-for') {
    const list = attrValue(attrs.list, scope);
    if (!Array.isArray(list)) return null;
    const as = String(attrs.as ?? 'item');
    return list.map((item, i) => {
      const inner: Scope = Object.create(scope);
      inner[as] = item;
      inner.$index = i;
      return createElement(Fragment, { key: i }, ...renderNodes(children, inner));
    });
  }

  if (tag === 'dc-import') {
    const name = String(attrs.name ?? '');
    const Child = getComponent(name);
    if (!Child) return createElement('div', { style: { color: '#A61F1F' } }, `[brak komponentu ${name}]`);
    const props: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(attrs)) {
      if (key === 'name' || key.startsWith('hint-')) continue;
      const v = attrValue(raw, scope);
      props[key.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())] = key === 'style' && typeof v === 'string' ? parseStyle(v) : v;
    }
    return createElement(Child, props);
  }

  return createElement(tag, elementProps(tag, attrs, scope), ...renderNodes(children, scope));
}

/** Base class every design file's `class Component extends DCLogic` builds on. */
export class DCLogic extends Component<Record<string, unknown>, Record<string, unknown>> {
  get demo() {
    return demo;
  }

  renderVals(): Record<string, unknown> {
    return {};
  }

  render(): ReactNode {
    const mod = (this.constructor as unknown as { dc: DcModule }).dc;
    const scope: Scope = { ...GLOBALS, ...(this.renderVals() ?? {}) };
    return createElement(
      Fragment,
      null,
      ...mod.styles.map((css, i) => createElement('style', { key: `s${i}` }, css)),
      ...renderNodes(mod.tree, scope),
    );
  }
}
