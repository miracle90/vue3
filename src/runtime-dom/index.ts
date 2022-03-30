import { nodeOps } from "./nodeOps";
import { createRenderer } from "../runtime-core/index";
import { patchProp } from "./patchProp";

// dom操作
const renderOptions = {
  ...nodeOps,
  patchProp,
};

function ensureRenderer() {
  return createRenderer(renderOptions);
}
// createApp(App).mount('#app')
export function createApp(rootComponent) {
  // 1、根据组件，创建一个渲染器
  const app = ensureRenderer().createApp(rootComponent);
  const { mount } = app;
  app.mount = function (container) {
    container = document.querySelector(container)
    // 挂载时，需要先将容器清空
    container.innerHTML = "";
    mount(container);
  };
  return app;
}
