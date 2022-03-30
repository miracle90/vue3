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
function createReactiveEffect(fn, options) {
  const effect = () => {
    activeEffect = effect;
    return fn(); // 用户自己写的逻辑，内部会对数据进行取值操作，在取值时，可以拿到activeEffect
  };
  return effect;
}
// {
//   object: {
//     key: [effect, effect, ...]
//   }
// }
// 将属性和effect关联
function tracker(target, key) {
  // key和activeEffect关联
  if (activeEffect === undefined) {
    return;
  }
}
