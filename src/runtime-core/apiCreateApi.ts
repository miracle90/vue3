import { createVnode } from "./vnode";

export function createAppAPI(render) {
  return (rootComponent) => {
    const app = {
      mount(container) {
        // 用户调用的mount方法
        const vnode = createVnode(rootComponent);
        render(vnode, container); // 虚拟节点，container
      }, // 和平台是无关的
    };
    return app;
  };
}
