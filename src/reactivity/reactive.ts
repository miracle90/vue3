import { isObject } from "../shared/index";
import { mutableHandlers } from "./baseHandlers";

export function reactive(target) {
  // 将目标变成响应式对象, Proxy
  return createReactive(target, mutableHandlers); // 核心操作：读取时依赖收集，数据变化时重新执行effect
}
// 缓存，解决重复代理的问题
const proxyMap = new WeakMap();
function createReactive(target, baseHandlers) {
  // 如果不是对象，直接返回
  if (!isObject(target)) {
    return target;
  }
  if (proxyMap.get(target)) return proxyMap.get(target);
  // 只是对最外层对象做代理，默认不会递归，而且不会重写对象中的属性
  const proxy = new Proxy(target, baseHandlers);
  proxyMap.set(target, proxy);
  return proxy;
}
