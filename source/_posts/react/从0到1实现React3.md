---
title: 从 0 到 1 实现 React（三）实现 diff
date: 2022-02-15 08:00:59
tags: 
  - react
  - 从 0 到 1 系列
categories: react
---


截止到目前，我们的 react 已经可以完成首次渲染，但还不能响应式更新和删除，下面我们来实现一下。

## 保存 old fiber

```diff
// ...

function render(element, container) {
  // 虽然后面会给这个对象添加更多属性，但这里是第一个 fiber
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
+   alternate: currentRoot,
  }
  nextUnitOfWork = wipRoot
}

 function commitRoot() {
   commitWork(wipRoot.child)
+  // commit 后，新 fiber 就变成了旧 fiber，更新一下旧 fiber
+  currentRoot = wipRoot
   wipRoot = null
 }

// ...

let nextUnitOfWork = null
+ // 当有新 fiber root 后，会拿它跟当前 root fiber 做对比，所以需要缓存当前 root fiber
+ let currentRoot = null
let wipRoot = null

//...
```
- 缓存当前的`root fiber`，以便有了新的`root fiber`后可以进行`diff`
- 给每一个 fiber 都新增一个`alternate`属性，用于存放旧 fiber

## 提取 diff 部分并进行封装

之前我们处理 diff 部分是在`performUnitOfWork`方法里，现在将其提出来，封装到新方法`reconcileChildren`里

```diff
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  const elements = fiber.props.children

+  reconcileChildren(fiber, elements)

-    let index = 0
-    let prevSibling = null

-    // 1. 遍历当前fiber的children
-    // 2. 给children里的每个child指定3个指针，分别指向其 父、子、兄弟三个节点
-    while (index < elements.length) {
-      const element = elements[index]

-      const newFiber = {
-        type: element.type,
-        props: element.props,
-        parent: fiber,
-        dom: null,
-      }

-      if (index === 0) {
-        fiber.child = newFiber
-      } else {
-        prevSibling.sibling = newFiber
-      }

-      prevSibling = newFiber
-      index++
-    }

  // 下面的操作是返回下一个单元——nextUnitOfWork
  // 1. 优先找child
  // 2. 没有child找兄弟
  // 3. 没有兄弟，找叔叔，也就是递归到父元素的兄弟
  // 4. 没有叔叔就一直往上递归...
  if (fiber.child) {
    return fiber.child
  }
  // ...
}
  
+ function reconcileChildren(wipFiber, elements) {
+     let index = 0
+     let prevSibling = null
+     ...
+ }
```

在 `reconcileChildren` 方法中，把 `new fiber` 和 `old fiber` 表示出来 (便于 TODO 部分进行对比)，并将`old fiber`的变化也加入到`while`迭代中来

```diff
function reconcileChildren(wipFiber, elements) {
  let index = 0
+ // 从 alternate 找到旧父fiber的第一个child，作为第一个要对比的old fiber
+ let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null

  // 1. 遍历当前fiber的children
  // 2. 给children里的每个child指定3个指针，分别指向其 父、子、兄弟三个节点
-  while (index < elements.length) {
+  while (index < elements.length || oldFiber != null) {
    const element = elements[index]

+    let newFiber = null
-    const newFiber = {
-      type: element.type,
-      props: element.props,
-      parent: wipFiber,
-      dom: null,
-    }

+ // TODO diff部分将在这里实现

+    if (oldFiber) {
+        oldFiber = oldFiber.sibling
+    }
    
    if (index === 0) {
      wipFiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}
```
下面我们来完成 `reconcileChildren` 方法里的*TODO*部分，也就是 diff

## diff

这里的 diff 主要是更新 fiber 的属性，还没有到真实的操作 dom

### 对比的策略

- 新、老 fiber 的 type 相同：保留 dom，更新属性
- 新、老 fiber 的 type 不同：创建新 fiber，删除旧 fiber

下面写出大体框架
```diff
while (index < elements.length || oldFiber != null) {
    const element = elements[index]

    let newFiber = null
    
+   const sameType =
+   oldFiber &&
+   element &&
+   element.type == oldFiber.type

+   if (sameType) {
     // TODO update the node
+   }
+   if (element && !sameType) {
     // TODO add this node
+   }
+   if (oldFiber && !sameType) {
     // TODO delete the oldFiber's node
+   }
    
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
}
```

### 对比旧 fiber，创建新 fiber

下面我们来完成上面 3 个 *TODO* 部分：

```js
const sameType =
  oldFiber &&
  element &&
  element.type == oldFiber.type

if (sameType) {
  newFiber = {
    type: oldFiber.type,
    props: element.props,
    dom: oldFiber.dom,
    parent: wipFiber,
    alternate: oldFiber,
    effectTag: "UPDATE",
  }
}
if (element && !sameType) {
  newFiber = {
    type: element.type,
    props: element.props,
    dom: null,
    parent: wipFiber,
    alternate: null,
    effectTag: "PLACEMENT",
  }
}
if (oldFiber && !sameType) {
  oldFiber.effectTag = "DELETION"
  deletions.push(oldFiber)
}
```

- 给每个 fiber 新增了`effectTag`属性，后面统一处理的时候，就知道是`更新`、`删除`还是`插入`
- 新增了`deletions`数组，存放所有待删除的`fiber`，后面统一删除里面的`dom`

上面的代码已经完成了迭代所有旧 fiber，并将其更新为了新 fiber

### 处理 deletions 数组

清空`deletions`数组将在 `commit` 这个阶段进行处理，而我们会将包括删除在内的所有更新操作都放到`commitWork`方法里去做
```diff
function render(element, container) {
  // 虽然后面会给这个对象添加更多属性，但这里是第一个 fiber
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  }
+ deletions = []
  nextUnitOfWork = wipRoot
}

function commitRoot() {
+  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
+ let deletions = null
```

### commitWork

下面我们来完善 `commitWork` 方法，`commitWork`除了插入，还有删除和更新
```diff
function commitWork(fiber) {
  if (!fiber) return

  const domParent = fiber.parent.dom
- domParent.appendChild(fiber.dom)
+ if ( fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
+   // 插入新dom
+   domParent.appendChild(fiber.dom)
+ } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
+   // 更新dom属性
+   updateDom(
+     fiber.dom,
+     fiber.alternate.props,
+     fiber.props
+   )
+ } else if (fiber.effectTag === "DELETION") {
+   // 删除dom
+   domParent.removeChild(fiber.dom)
+ }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

+ function updateDom(dom, prevProps, nextProps) {
+   // TODO
+ }
```

### updateDom

上面新增了一个 `updateDom` 方法，`updateDom` 会将所有的 diff 真实反应到的 dom 上，现在我们来实现它：

```js
// 判断是否是 dom 事件
const isEvent = key => key.startsWith("on")
// 不是 dom 事件，也不是 children 属性，才是要更新的属性
const isProperty = key =>
  key !== "children" && !isEvent(key)
// 判断是否是新属性
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
// 判断属性是否被删除
const isGone = (prev, next) => key => !(key in next)
function updateDom(dom, prevProps, nextProps) {
  // 删除旧的 dom 事件监听函数
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })

  // 删除旧的属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })

  // 设置新的属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })
  
  // 设置新的 dom 事件监听函数
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        nextProps[name]
      )
    })
}
```
实现很简单粗暴：删除旧属性，创建新属性

最后将 `createDom` 里的 dom 更新，也改为使用 `updateDom`：

```diff
function createDom(fiber) {
  const dom =
      fiber.type == "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(fiber.type)

+  updateDom(dom, {}, fiber.props);
-  // children 被放到了 props 属性里，这里过滤掉 children
-  const isProperty = key => key !== "children"

-  Object.keys(fiber.props)
-    .filter(isProperty)
-    // 设置 dom 元素的属性，这里是简化版意思一下，直接赋值
-    .forEach(name => dom[name] = fiber.props[name])
  
  return dom
}
```


现在，我们的 diff 基本实现

[本章源码](https://github.com/chao31/Didact/blob/feature/chao31_diff/index.js)

