import { createVnode } from "./vnode";

export function h(type, props = {}, children = null) {
  return createVnode(type, props, children);
}
