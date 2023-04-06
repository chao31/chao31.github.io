---
title: 从 0 到 1 实现 React（四）final
date: 2022-02-18 08:00:59
tags: 
  - react
  - 从 0 到 1 系列
categories: react
---

截止目前，我们已经可以渲染 html 标签组件了，但还不支持 react 的函数组件，我们替换一下试试

```diff
- const profile = (
-  <div className="profile">
-    <span className="profile-title">title</span>
-     <h3 className="profile-content">content</h3>
-     我是一段文本
-  </div>
- );

+ function App(props) {
+   return <h1>Hi {props.name}</h1>
+ }
+ const profile = <App name="foo" />

const container = document.getElementById("root")
Didact.render(profile, container)
```
会发现报错了，因为函数组件要执行一下，才会返回 jsx

## 支持函数组件

函数组件有两个地方不同：

- 函数组件的 fiber 没有 dom 节点
- 执行一下函数组件，才有 children

### 判断是否是函数组件

所以在 `performUnitOfWork` 方法中，我们要先检测组件是否是函数组件，然后将分别处理的逻辑提取到两个函数 `updateHostComponent` 和 `updateFunctionComponent` 内：

```diff
function performUnitOfWork(fiber) {
-  if (!fiber.dom) {
-    fiber.dom = createDom(fiber)
-  }

-  const elements = fiber.props.children
-  reconcileChildren(fiber, elements)
  
+  const isFunctionComponent =
+    fiber.type instanceof Function
+  if (isFunctionComponent) {
+    updateFunctionComponent(fiber)
+  } else {
+    updateHostComponent(fiber)
+  }

  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

// 处理普通组件
+ function updateHostComponent(fiber) {
+   if (!fiber.dom) {
+     fiber.dom = createDom(fiber)
+   }
+   reconcileChildren(fiber, fiber.props.children)
+ }

// 处理函数组件
+ function updateFunctionComponent(fiber) {
+   // 执行函数组件，返回jsx
+   const children = [fiber.type(fiber.props)]
+   reconcileChildren(fiber, children)
+ }
```

### 处理函数组件没有 dom 的问题

因为函数组件会出现没有 dom 的情况，那 `commitWork` 方法的逻辑就要修正一下，通过`递归`往上去找有 dom 的父元素

```diff
// 递归插入所有 dom
function commitWork(fiber) {
  if (!fiber) return

-  const domParent = fiber.parent.dom
+  let domParentFiber = fiber.parent
+  while (!domParentFiber.dom) {
+    domParentFiber = domParentFiber.parent
+  }
+  const domParent = domParentFiber.dom

  if ( fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    // 插入新 dom
    domParent.appendChild(fiber.dom)
    
  // ...
  
   } else if (fiber.effectTag === "DELETION") {
    // 删除 dom
    domParent.removeChild(fiber.dom)
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
 }
 
+ // 函数组件没有 dom，需要一直往上递归找父 dom
+ function commitDeletion(fiber, domParent) {
+  if (fiber.dom) {
+    domParent.removeChild(fiber.dom)
+  } else {
+    commitDeletion(fiber.child, domParent)
+  }
}
 ```

## hooks

截止目前，我们还不支持 `hooks`，我们替换一个有 hooks 的 demo 来支持一下：

```diff
- function App(props) {
-   return <h1>Hi {props.name}</h1>
- }
- const profile = <App name="foo" />

+ function Counter() {
+   const [state, setState] = Didact.useState(1)
+   return (
+     <div>
+       <button onClick={() => setState(c => c + 1)}>
+         点击 + 1
+       </button>
+       <p>Count: {state}</p>
+     </div>
+   )
+ }
+ const profile = <Counter />

const container = document.getElementById("root")
Didact.render(profile, container)
```

### fiber 新增 hooks 属性

保存当前被设置 `hooks` 的 `fiber`，因为 `useState` 可以调用多次，所以需要维护一个 `hooks` 队列，用来存放多个`hook`，修改 `updateFunctionComponent`方法：

```diff
+ let wipFiber = null
+ let hookIndex = null

function updateFunctionComponent(fiber) {
+   wipFiber = fiber
+   hookIndex = 0
+   wipFiber.hooks = []
    // 执行函数组件，返回jsx
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}
```

### 实现 useState

```js
function useState(initial) {
  const oldFiber = wipFiber.alternate;
  const oldHook = oldFiber?.hooks && oldFiber.hooks[hookIndex];
  // 设置新 hook
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  // 执行老 hook 队列里的 setState 方法
  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  const setState = action => {
    hook.queue.push(action)
    // 设置 nextUnitOfWork，从而在下一次闲时启动更新
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }

  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}
```
- 因为是通过当前 `index` 去找 `老hooks` 数组里对应的 `hook`，`新老hooks`数组里的`hook`是一一对应的，所以在 react 中 hook 不能放在条件判断语句内，这样 hook 在数组里的位置就会有变化，新旧的 index 不能对应起来
- `useState` 除了要返回最后计算的`state`和对应的`setState`方法，还要在这之前执行上一次`hooks`队列里的任务
- 每调用一次`useState`，`hook`队列就又入列一个任务
- 执行`setState`，会赋值`nextUnitOfWork`，这样就启动了浏览器闲时处理的开关，下一次闲时就会更新`diff`
- 为了简单，这里的`setState`只支持传入一个函数，不能传入一个值，但要支持其实也很简单，判断一下是个值就转换成一个返回该值的函数，即可

到这里，我们就实现了自己的一个 react——`Didact`

[整体源码](https://github.com/chao31/Didact/blob/feature/chao31_final/index.js)

