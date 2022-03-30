import { effect } from "../index";
import { ShapeFlags } from "../shared/shapeFlags";
import { createAppAPI } from "./apiCreateApi"; //  用户调用的createApp方法
import { createComponentInstance, setupComponent } from "./component";

// options是平台传过来的方法，不同的平台可以实现不同的操作逻辑
export function createRenderer(options) {
  return baseCreateRenderer(options);
}

function baseCreateRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    setElementText: hostSetElementText,
    insert: hostInsert,
    remove: hostRemove,
  } = options;

  const mountElement = (vnode, container, anchor) => {
    // 挂载真实节点，vnode虚拟节点，container容器
    let { shapeFlag, props } = vnode;
    let el = (vnode.el = hostCreateElement(vnode.type));
    // 创建子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag && ShapeFlags.ARRAY_CHILDREN) {
      // 数组
      mountChilden(vnode.children, el);
    }
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    hostInsert(el, container, anchor);
  };
  const mountChilden = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }
  };
  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      // 新的属性，覆盖掉老的
      for (const key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
          hostPatchProp(el, key, prev, next);
        }
      }
      // 老的有的属性，新的没有，将老的属性删除
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    }
  };
  const patchKeyChildren = (c1, c2, el) => {
    // 内部优化策略
    // 老的子节点是abc => abde
    let i = 0;
    let e1 = c1.length - 1; // 老子节点中的尾部索引
    let e2 = c2.length - 1; // 新子节点中的尾部索引
    // 从前往后
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnodeType(n1, n2)) {
        patch(n1, n2, el); // 会递归比对子元素
      } else {
        break;
      }
      i++;
    }
    // 从后往前
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // 只要i大于e1，表示新增了属性
    if (i > e1) {
      // 表示新增的部分
      if (i <= e2) {
        // 先根据e2取他的下一个元素，和数组长度进行比较
        const nextPos = e2 + 1;
        const anchor = nextPos < c2.length ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 删除
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 无规律情况 diff 算法
      // ab [cde] fg // s1 = 2, e1 = 4
      // ab [edch] fg // s2 = 2, e2 = 5
      const s1 = i;
      const s2 = i;
      // 新的索引和key做成一个映射表
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }
      const toBePatched = e2 - s2 + 1;
      const newIndexToOldMapIndex = new Array(toBePatched).fill(0);
      // 只是做相同属性的diff，但是位置可能还不对
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        let newIndex = keyToNewIndexMap.get(prevChild.key); // 获取新的索引
        if (newIndex === undefined) {
          hostRemove(prevChild.el); // 老的有，新的没有，直接删除
        } else {
          newIndexToOldMapIndex[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], el);
        }
      }
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        // 参照物
        let anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;
        if (newIndexToOldMapIndex[i] === 0) {
          // 这是一个新元素，直接插入到当前元素的下一个即可
          patch(null, nextChild, el, anchor);
        } else {
          // 根据参照物，依次将节点直接移动过去，所有节点都被移动了，按理说有部分节点不需要动
          // 没有考虑复用的情况
          hostInsert(nextChild.el, el, anchor);
        }
      }
    }
  };
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children; // 获取所有老的子节点
    const c2 = n2.children; // 获取所有新的子节点

    const prevShapeFlag = n1.shapeFlag; // 上一次元素的类型
    const shapeFlag = n2.shapeFlag; // 这一次的元素类型
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 1、老的是文本，新的是文本，新的替换老的
      // 2、老的是数组，新的是文本，覆盖掉老的
      if (c2 !== c1) {
        hostSetElementText(el, c2);
      }
    } else {
      // 新的是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        console.log("进入diff阶段");
        patchKeyChildren(c1, c2, el);
      } else {
        // 新的是数组，老的可能是文本或者数组
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 移除老的文本
          hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 去把新的元素进行挂载，生成新的节点塞进去
          for (let i = 0; i < c2.length; i++) {
            patch(null, c2[i], el);
          }
        }
      }
    }

    // 3、老的是文本，新的是数组，老的文本删掉，把新的数组插入到老的节点中
    // 4、新老都是数组，进入 diff 阶段
  };
  const patchElement = (n1, n2, container) => {
    // 如果n1和n2类型一样，表示节点需要复用
    let el = (n2.el = n1.el);
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    // 比对前后属性的差异
    patchProps(oldProps, newProps, el);
    // 比对前后子元素
    patchChildren(n1, n2, el);
  };
  const mountComponent = (initialVnode, container) => {
    // 组件挂载逻辑
    // 1、创建组件的实例
    // 2、找到组件的render方法
    // 3、执行render
    // 组件实例要记录当前组件的状态
    const instance = (initialVnode.component =
      createComponentInstance(initialVnode));
    setupComponent(instance); // 找到组件的setup方法
    // 调用render方法，如果render方法中的数据变化了，会重新渲染
    setupRenderEffect(instance, initialVnode, container); // 给组件创建一个effect，用于渲染，等于 vue2 中的 watcher
  };
  const setupRenderEffect = (instance, initialVnode, container) => {
    effect(function componentEffect() {
      if (!instance.isMounted) {
        // 渲染组件中的内容
        const subTree = (instance.subTree = instance.render()); // 组件对应渲染的结果
        patch(null, subTree, container); // 渲染subTree对应的节点
        instance.isMounted = true;
      } else {
        // 更新逻辑
        let prev = instance.subTree; //  上一次的渲染结果
        let next = instance.render(); // 这一次的
        patch(prev, next, container);
      }
    });
  };
  const updateComponent = (n1, n2, container) => {};
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2, container);
    }
  };
  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      mountComponent(n2, container);
    } else {
      updateComponent(n1, n2, container);
    }
  };
  const render = (vnode, container) => {
    // 需要将虚拟节点，变成真实节点，挂载到容器上
    patch(null, vnode, container);
  };
  const isSameVnodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key;
  };
  const patch = (n1, n2, container, anchor = null) => {
    let { shapeFlag } = n2;
    if (n1 && !isSameVnodeType(n1, n2)) {
      hostRemove(n1.el); // 把老节点的真实节点删掉
      n1 = null;
    }

    // 20 12
    // 与操作
    if (shapeFlag & ShapeFlags.ELEMENT) {
      // 处理元素
      processElement(n1, n2, container, anchor);
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // 处理组件;
      processComponent(n1, n2, container);
    }
  };
  return {
    createApp: createAppAPI(render),
  };
}
