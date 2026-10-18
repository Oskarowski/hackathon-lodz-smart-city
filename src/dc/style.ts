// Parses an inline `style` attribute into a React style object.
// Shared by the design compiler (static styles) and the runtime (styles with holes).
const camel = (s: string) => s.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

export function parseStyle(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  let depth = 0;
  let quote = '';
  let start = 0;
  const decls: string[] = [];
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (quote) {
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ';' && depth === 0) {
      decls.push(css.slice(start, i));
      start = i + 1;
    }
  }
  decls.push(css.slice(start));
  for (const decl of decls) {
    const colon = decl.indexOf(':');
    if (colon < 0) continue;
    const prop = decl.slice(0, colon).trim();
    const value = decl.slice(colon + 1).trim().replace(/\s*!important$/, '');
    if (!prop || !value) continue;
    if (prop.startsWith('--')) out[prop] = value;
    else {
      const p = prop.toLowerCase();
      out[p.startsWith('-ms-') ? camel(p.slice(1)) : camel(p.replace(/^-/, '').replace(/^webkit/, 'Webkit').replace(/^moz/, 'Moz'))] = value;
    }
  }
  return out;
}
