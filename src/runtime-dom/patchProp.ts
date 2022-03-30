function patchClass(el, value) {
  if (value == null) {
    value == "";
  }
  el.className = value;
}

function patchStyle(el, prev, next) {
  const style = el.style;
  if (!next) {
    el.removeAttribute("style"); // 不需要样式
  } else {
    for (let key in next) {
      style[key] = next[key];
    }
    if (prev) {
      // 删除之前的css属性
      for (const k in prev) {
        if (next[k] == null) {
          style[k] = "";
        }
      }
    }
  }
}

function patchAttr(el, key, value) {
  if (value == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}

export function patchProp(el, key, prevValue, nextValue) {
  switch (key) {
    case "class":
      patchClass(el, nextValue);
      break;
    case "style":
      patchStyle(el, prevValue, nextValue);
      break;
    default:
      patchAttr(el, key, nextValue);
      break;
  }
}
