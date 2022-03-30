export const nodeOps = {
  // 创建元素
  createElement(type) {
    return document.createElement(type);
  },
  // 设置文本节点的文本
  setElementText(el, text) {
    el.textContent = text;
  },
  // 插入
  insert(child, parent, anchor = null) {
    parent.insertBefore(child, anchor);
  },
  // 移除
  remove(child) {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
};
