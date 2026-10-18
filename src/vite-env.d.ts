/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.dc.html' {
  import type { DcModule } from './dc/runtime';
  export const title: DcModule['title'];
  export const props: DcModule['props'];
  export const styles: DcModule['styles'];
  export const tree: DcModule['tree'];
  export const define: DcModule['define'];
}
