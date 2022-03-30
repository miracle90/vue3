import {
  isSymbol,
  isObject,
  isArray,
  isInteger,
  hasOwn,
  hasChanged,
} from "../shared/index";
import { reactive } from "./reactive";
import { track, trigger } from "./effect";

// 获取对象属性会执行此方法
function createGetter() {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver);
    // 如果取得值是symbol类型，忽略
    if (isSymbol(key)) {
      // 数组中有很多symbol的内置方法
      return res;
    }
    // 依赖收集
    track(target, key);
    console.log("此时数据做了获取的操作", isObject(res));
    // 懒递归：vue3取值为对象才会代理，vue2是对全部属性进行劫持
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  };
}
// 设置属性值的时候会执行此方法
function createSetter() {
  return function set(target, key, value, receiver) {
    // vue2不支持新增属性
    // 新增还是修改？
    const oldValue = target[key]; // 之前的值
    // 1、数组新增的逻辑，2、对象的逻辑
    const hadKey =
      isArray(target) && isInteger(key)
        ? Number(key) < target.length
        : hasOwn(target, key); // 数组，而且改了索引
    const result = Reflect.set(target, key, value, receiver); // target[key] = value
    if (!hadKey) {
      console.log("新增属性");
      trigger(target, "add", key, value);
    } else if (hasChanged(value, oldValue)) {
      console.log("修改属性");
      trigger(target, "set", key, value, oldValue);
    }
    return result;
  };
}

const get = createGetter(); // 为了预置参数
const set = createSetter();

export const mutableHandlers = {
  get,
  set,
};
