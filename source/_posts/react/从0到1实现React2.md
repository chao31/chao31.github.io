---
title: 从 0 到 1 实现 React（二）实现 fiber 
date: 2022-02-06 08:00:59
tags: 
  - react
  - 从 0 到 1 系列
categories: react
---

## 实现 render 方法

这里要实现的是和 `ReactDOM.render`同样的功能，代码如下：

```diff
// ...

+ function render(element, container) {
+   const dom = element.type == "TEXT_ELEMENT"
+     ? document.createTextNode("")
+     : document.createElement(element.type)
+ 
+   // children 被放到了 props 属性里，这里过滤掉 children
+   const isProperty = key => key !== "children"
+ 
+   Object.keys(element.props)
+     .filter(isProperty)
+     // 设置 dom 元素的属性，这里是简化版意思一下，直接赋值
+     .forEach(name => dom[name] = element.props[name])
+   
+   // 递归子元素
+   element.props.children.forEach(child =>render(child, dom))
+ 
+   container.appendChild(dom)
+ }

const profile = (
  <div className="profile">
    <span className="profile-title">title</span>
    <h3 className="profile-content">content</h3>
  </div>
);

console.log('成功启动', profile);

+ const container = document.getElementById("root")
+ Didact.render(profile, container)
```

- 创建节点时，不同类型的节点用不同方法创建，文本节点用`createTextNode`，其他节点用`createElement`
- 我们创建 jsx 数据结构时，将`children`统一放到了`props`属性里，所以给 dom 添加`props`前，遍历`props`时，需过滤掉`props`里的`children`
- 这里给 dom 添加`props`属性的实现非常简单，只有一个赋值表达式`dom[name] = element.props[name]`，其实是想用一行代码来代表此处还有着冗杂的属性处理，但写太复杂对理解整体 react 源码没有帮助，但感兴趣可以[阅读](https://stackoverflow.com/questions/6003819/what-is-the-difference-between-properties-and-attributes-in-html)。

这样大家就可以看到页面已经被渲染出来了，如下图：


![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d28d2cef7770440995c29d81f2d793bf~tplv-k3u1fbpfcp-watermark.image?)

截止到此处的[源码](https://github.com/chao31/Didact/blob/feature/chao31_render/index.js)

## 为什么要引入 fiber

我们的`render`方法是用`递归`实现的，那么问题就来了，一旦开始递归，就不会停止，直至渲染完整个 dom 树。

那如果 dom 树很大，js 就会占据着主线程，而无法做其他工作，比如`用户的交互得不到响应`、`动画不能保持流畅`，因为它们必须等待渲染完成。为了展示这个问题，下面有个[小演示](https://pomber.github.io/incremental-rendering-demo/react-sync.html)：

>为了保持行星的旋转，主线程需要在每 16ms 左右就要运行一次。如果主线程被其他东西阻塞，比如设置了主线程占用 200 毫秒，大家就会发现动画开始丢失帧的现象——行星会发生冻结、卡顿，直到主线程再次被释放。

正是因为 react 的渲染会阻塞主线程太久，所以出现了`react fiber`。

## fiber 是什么

`react fiber`没法`缩短`整颗树的渲染时间，但它使得渲染过程被分成一小段、一小段的，相当于有了“保存工作进度”的能力，js 每渲染完一个单元节点，就让出主线程，丢给浏览器去做其他工作，然后再回来继续渲染，依次往复，直至比较完成，最后一次性的更新到视图上。

下面用一段伪代码来理解这个拆分过程：

```js
// 被拆分成的一个一个单元的小任务
let nextUnitOfWork = null

function workLoop(deadline) {
  // requestIdleCallback 给 shouldYield 赋值，告诉我们浏览器是否空闲
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }
  // 循环调用 workLoop
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

// 每次执行完一个单元任务，会返回下一个单元任务
function performUnitOfWork(nextUnitOfWork) {
  // TODO
}
```

不熟悉 **requestIdleCallback** 可以[点这里查看](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)，这个方法很简单：它需要传入一个 **callback**，浏览器会在空闲时去调用这个 **callback**，然后给这个**callback** 传入一个 [IdleDeadline](https://developer.mozilla.org/zh-CN/docs/Web/API/IdleDeadline)，`IdleDeadline` 会预估一个剩余闲置时间，我们可以通过还剩多少闲置时间去判断，是否足够去执行下一个`单元任务`。

## fiber 的数据结构

为了能拆分成上面的`单元任务`，我们需要一种新的数据结构——`fiber链表`，例如我们要渲染如下元素：

```js
Didact.render(
  <div>
    <h1>
      <p />
      <a />
    </h1>
    <h2 />
  </div>,
  container
)
```

它被转化成的`fiber 链表`的结构如下：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/57137a19680747a985cdf30b90427ad8~tplv-k3u1fbpfcp-watermark.image?)

- 我们用`fiber`来代指一个要处理的`单元任务`，如：上面的一个`h1`就是一个`fiber`
- 几乎每一个`fiber`都有 3 个指针，所以每个`fiber`都可以找到它的父、子 (第一个子元素)、兄弟元素（这也是渲染可以中断的原因）
- 每当渲染完一个`fiber`，`performUnitOfWork`都会返回下一个待处理的`fiber`，浏览器闲时就会去处理下一个`fiber`，以此循环
- 优先返回`child fiber`做为下一个待处理的`fiber`；若`child fiber`不存在，则返回`兄弟 fiber`；若`兄弟 fiber`不存在，则往上递归，找父元素的`兄弟 fiber`；以此循环...

例如：
- 当前渲染了`div`，那么下一个要处理的就是`h1 fiber`
- 如果`child fiber`不存在，如 `p fiber`,则下一个要处理的是兄弟`a fiber`
- 如果`child fiber`和`兄弟 fiber`都不存在，如：`a fiber`，则往上找`叔叔 fiber`，即`h2 fiber`

## 实现 fiber
在`render`方法里为`nextUnitOfWork`赋值第一个`fiber`，待浏览器闲时检测到了`nextUnitOfWork`有值，就会启动 loop 循环，不断地设置下一个`fiber`，也不断的遍历全部节点，代码如下：

```js
function createDom(fiber) {
  const dom =
      fiber.type == "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(fiber.type)

  // children 被放到了 props 属性里，这里过滤掉 children
  const isProperty = key => key !== "children"

  Object.keys(fiber.props)
    .filter(isProperty)
    // 设置 dom 元素的属性，这里是简化版意思一下，直接赋值
    .forEach(name => dom[name] = fiber.props[name])
  
  return dom
}

function render(element, container) {
  // 虽然后面会给这个对象添加更多属性，但这里是第一个 fiber
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  }
}
```
- 修改`render`方法：设置待执行的初始`fiber`
- 新增`createDom`方法：将原 `render` 方法里的主要逻辑移到 `createDom` 中，即根据 `fiber` 的属性，创建 `dom节点`


实现 `performUnitOfWork` 方法：

```js
// 每次执行完一个单元任务（做了以下 3 件事），会返回下一个单元任务
// 1. 给 fiber 添加 dom，并插入父元素
// 2. 给当前 fiber 的每一个子元素生成 fiber 节点
// 3. 找到要返回的下一个 unitOfWork
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }

  const elements = fiber.props.children
  let index = 0
  let prevSibling = null

  // 1. 遍历当前 fiber 的 children
  // 2. 给 children 里的每个 child 指定 3 个指针，分别指向其 父、子、兄弟三个节点
  while (index < elements.length) {
    const element = elements[index]

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }

    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }

  // 下面的操作是返回下一个单元——nextUnitOfWork
  // 1. 优先找 child
  // 2. 没有 child 找兄弟
  // 3. 没有兄弟，找叔叔，也就是递归到父元素的兄弟
  // 4. 没有叔叔就一直往上递归...
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
```
里面的注释很详尽，就不再讲述 `performUnitOfWork` 的实现了。

## UI 展示不完整问题

从下面代码可以看出，每个`fiber`都会执行一次插入 dom，但因渲染是会被打断的，所以就会出现只插入部分 dom 的情况，使某一刻的 UI 完整不展示。

```diff
function performUnitOfWork(fiber) {
// ...

- if (fiber.parent) {
-     fiber.parent.dom.appendChild(fiber.dom)
- }

//...
}
```


所以要删除上面的实现，转而通过判断 root 节点是否全部渲染完成，若全部完成，再将整个`root fiber`插入 dom，实现如下：

```diff
function render(element, container) {
-  nextUnitOfWork = {
+  wipRoot = {
     dom: container,
     props: {
       children: [element],
     },
   }
+  nextUnitOfWork = wipRoot
}

+ function commitRoot() {
+   commitWork(wipRoot.child)
+   wipRoot = null
+ }

+ // 递归插入所有dom
+ function commitWork(fiber) {
+   if (!fiber) return
+   
+   const domParent = fiber.parent.dom
+   domParent.appendChild(fiber.dom)
+   commitWork(fiber.child)
+   commitWork(fiber.sibling)
+ }

// 被拆分成的一个一个单元的小任务
let nextUnitOfWork = null

+ let wipRoot = null

function workLoop(deadline) {
  // requestIdleCallback 给 shouldYield 赋值，告诉我们浏览器是否空闲
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

+ // 没有下一个待渲染的fiber，表示所有dom渲染完成，commit到root
+ if (!nextUnitOfWork && wipRoot) {
+   commitRoot()
+ }
  
  // 循环调用 workLoop
  requestIdleCallback(workLoop)
}

```
通过上面最后的 `commitRoot` 方法，将完整的 `root fiber` 里的所有 `dom` 通过递归插入到了页面，就修复了 UI 出现不完整展示的问题。

[本章源码](https://github.com/chao31/Didact/blob/feature/chao31_fiber/index.js)



---
参考：
1. [build your own react](https://pomb.us/build-your-own-react/)
2. [Fibre-递增对比](https://github.com/chinanf-boy/didact-explain/blob/master/5.Fibre.readme.md)
3. [有 React fiber，为什么不需要 Vue fiber？](https://mp.weixin.qq.com/s/K8mHbIwR6NMaIrutDzg61A)


