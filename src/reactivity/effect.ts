import { isArray, isInteger } from "../shared/index";

// effect就是vue2中的watcher
export function effect(fn, options: any = {}) {
  const effect = createReactiveEffect(fn, options);
  // 如果没有lazy，默认先执行一次
  if (!options.lazy) {
    effect();
  }
  return effect;
}
let activeEffect; // 用来存储当前的effect
let uid = 0;
let effectStack = [];
function createReactiveEffect(fn, options) {
  const effect = () => {
    // 防止递归执行
    if (!effectStack.includes(effect)) {
      try {
        activeEffect = effect;
        effectStack.push(activeEffect);
        return fn(); // 用户自己写的逻辑，内部会对数据进行取值操作，在取值时，可以拿到activeEffect
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  effect.id = uid++;
  effect.deps = []; // 用来表示 effect 中依赖了哪些属性
  effect.options = options;
  return effect;
}
// {
//   object: {
//     key: [effect, effect, ...]
//   }
// }
const targetMap = new WeakMap(); // {}
// 将属性和effect关联
export function track(target, key) {
  // key和activeEffect关联
  if (activeEffect === undefined) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set())); // 去重
  }
  if (!dep.has(activeEffect)) {
    // 如果没有effect，就把effect放进到集合中
    dep.add(activeEffect);
    activeEffect.deps.push(key); // 双向记忆的过程
  }
}

export function trigger(target, type, key, value?, oldValue?) {
  const depsMap = targetMap.get(target);
  // 没有做依赖收集
  if (!depsMap) {
    return;
  }
  const run = (effects) => {
    if (effects) {
      effects.forEach((effect) => effect());
    }
  };
  // 数组有特殊的情况
  if (key === "length" && isArray(target)) {
    depsMap.forEach((dep, key) => {
      // Map可以循环
      if (key === "length" || key >= value) {
        // 如果改的长度，小于数组原有的长度，应该更新视图
        run(dep);
      }
    });
  } else {
    // 对象的处理
    if (key !== void 0) {
      // 不等于空，说明了修改了key
      run(depsMap.get(key));
    }
    switch (type) {
      case "add":
        if (isArray(target)) {
          // 给数组通过索引增加选项
          if (isInteger(key)) {
            // 如果页面中直接使用了数组也会对数组进行取值操作，对length进行收集，新增属性时，直接触发length
            run(depsMap.get("length"));
          }
        }
        break;

      default:
        break;
    }
  }
}
