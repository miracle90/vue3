import { isString, isObject, isArray } from "../shared/index";
import { ShapeFlags } from "../shared/shapeFlags";

export function createVnode(type, props: any = {}, children = null) {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;
  // type是什么类型？对象，或者字符串
  const vnode = {
    // 虚拟节点，用来表示dom结构，也可以用来表示组件
    type,
    props,
    children,
    component: null, // 组件的实例
    el: null, // 虚拟节点要和真实节点做一个映射关系
    key: props.key,
    shapeFlag, // vue3里头的骚操作，虚拟节点的类型：元素、组件
  };
  if (isArray(children)) {
    // 1 16
    // 00000001
    // 00001000
    // 00001001 => 17
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN; // 如果在或等的过程中有一个是1，就是1
  } else {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  }
  return vnode;
}
