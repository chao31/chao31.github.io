---
title: react 原理
date: 2022-03-25 08:00:59
tags: 
  - react
  - 源码解析
categories: react
---

## 前言

React 的特点是 **快速响应** ，因为它解决了制约 **快速响应** 的两大因素：
-   `CPU 的瓶颈`：当项目变得庞大、组件数量繁多或遇到大量运算，js 会一直占用主线程，使得浏览器得不到控制权，就不能及时开始下一帧的绘制，从而导致页面的掉帧、卡顿。
-   `IO 的瓶颈`：当发送网络请求后，由于需要等待数据返回才能进一步操作，导致不能快速响应。

而 `fiber` 架构主要就是用来解决 `CPU` 和 `IO` 的瓶颈问题，这两个问题一直也是最影响前端开发体验的地方，前者会造成卡顿，后者会造成白屏。为此 react 引入了两个新概念：`Time Slicing` 时间分片和`Suspense`。

## CPU 的瓶颈

大多数浏览器的`刷新频率`都是`60Hz`，即每（1000ms / 60Hz）16.6ms 浏览器刷新一次。

在每 16.6ms 时间内，需要完成如下工作：

```js
js脚本执行 -----  样式布局 ----- 样式绘制
```

当 JS 执行脚本更新 dom 的时间过长，超出了 16.6ms，这次刷新就没有时间去执行`样式布局`和`样式绘制`了，页面就会出现掉帧，造成卡顿。

为了更加深入的理解这个问题，首先看一下浏览器的帧原理：

### 浏览器帧原理

页面的内容都是一帧一帧绘制出来的，浏览器刷新率代表浏览器一秒绘制多少帧。目前浏览器大多是 60Hz（60 帧/s），每一帧耗时也就是在 16ms 左右。原则上说 1s 内绘制的帧数越多，画面表现就也越细腻。那么在这一帧的（16ms）过程中浏览器又干了啥呢？

![图片 1](https://chao31.github.io/pics/FE-QA/anatomy-of-a-frame.svg)

通过上图可以清楚的知道，浏览器一帧会经过下面这几个过程：

1. 开始一帧
2. 输入事件的处理：`touchmove`、`click`、`scroll`等都应该最先触发，每帧触发一次（但也不一定）
3. 执行 `RequestAnimationFrame`
4. 布局（Layout）
5. 绘制（Paint）
6. 若还有时间，执行 `RequestIdelCallback`
7. 结束一帧

其中，第六步的 `RequestIdelCallback` 事件不是每一帧结束都会执行，只有在一帧的 16ms 中做完了前面 6 件事儿且还有剩余时间，才会执行。这里提一下，如果一帧执行结束后还有时间执行 `RequestIdelCallback` 事件，那么下一帧需要在事件执行结束才能继续渲染，所以 `RequestIdelCallback` 执行不要超过 30ms，如果长时间不将控制权交还给浏览器，会影响下一帧的渲染，导致页面出现卡顿和事件响应不及时。

### 如何解决 CPU 的瓶颈呢

答案是：在浏览器每一帧的时间中，预留一些时间给 JS 线程，React 利用这部分时间更新组件（源码中预留的初始时间是 5ms）。

当预留的时间不够用时，React 将线程控制权交还给浏览器，这样浏览器就有剩余时间执行`样式布局`和`样式绘制`，减少掉帧的可能性，而 React 则等待下一帧时间到来继续被中断的工作。

上面这种将将长任务分拆到每一帧中，像蚂蚁搬家一样一次执行一小段任务的操作，被称为时间切片（time slice）。所以，解决 CPU 瓶颈的关键是实现时间切片，而时间切片的关键是：将`同步的更新`变为`可中断的异步更新`。

## react 15 为什么不能做到快速响应

在 React 16 以前，Reconciler 采用递归的方式创建虚拟 DOM，递归过程是不能中断的。如果组件树的层级很深，递归会占用线程很多时间，造成卡顿。为什么 react 15 不能做到快速响应，首先来看一下 react 15 的架构：

### React 15 架构

React 15 架构可以分为两层：

- Reconciler（协调器）—— 负责找出变化的组件
- Renderer（渲染器）—— 负责将变化的组件渲染到页面上

#### Reconciler（协调器）

当调用 `this.setState`、`ReactDOM.render`等 API 会触发更新，`Reconciler` 会做如下工作：

- 执行函数组件、或 class 组件的 render 方法，将返回的 JSX 转化为虚拟 DOM
- 将虚拟 DOM 和上次更新时的虚拟 DOM 对比
- 通过`递归对比`找出本次更新中变化的虚拟 DOM
- 通知 `Renderer` 将变化的虚拟 DOM 渲染到页面上

#### Renderer（渲染器）

常见的 `Renderer`：

- `ReactDOM`：渲染浏览器环境
- `ReactNative`：渲染 App 原生组件
- `ReactTest`：用于测试

在每次更新发生时，Renderer 接到 Reconciler 通知，将变化的组件渲染在当前宿主环境。

### React 15 架构的缺点

React 15 会使用递归进行更新，由于递归一旦开始，中途就无法中断。当层级很深时，递归更新时间超过了 16ms，用户交互就会卡顿。

所以 react 16 将`同步的更新`变为`可中断的异步更新`，这也就是 fiber 架构：

## React 16 架构

React 16 架构可以分为三层：

- Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入 Reconciler
- Reconciler（协调器）—— 负责找出变化的组件
- Renderer（渲染器）—— 负责将变化的组件渲染到页面上

### Scheduler（调度器）

`requestIdleCallback`可以告诉我们浏览器是否有剩余时间，但基于以下因素，React 放弃使用：

- 浏览器兼容性
- 触发频率不稳定，受很多因素影响。比如当我们的浏览器切换 tab 后，之前 tab 注册的`requestIdleCallback` 触发的频率会变得很低

基于以上原因，React 16 polyfill 了一个功能更加完备的 `requestIdleCallback`，这就是 `Scheduler`。除了在空闲时触发回调的功能外，`Scheduler` 还提供了多种调度优先级供任务设置。

### Reconciler（协调 器）

通过下面代码可以看出，更新工作从`递归`变成了`可中断的循环过程`。每次循环都会调用 shouldYield 判断当前是否有剩余时间。

```js
/** @noinline */
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```

那么 React16 是如何解决中断更新时 DOM 渲染不完全的问题呢？

在 React16 中，Reconciler 与 Renderer 不再是交替工作，而是通过一次又一次在时间片段中对比，只有当全部组件都完成 Reconciler 对比完后，才会统一交给 Renderer。其中每一片时间片段的对比，Reconciler 都会为变化的虚拟 DOM 打上代表增/删/更新的标记，类似这样：

```js
export const Placement = /*             */ 0b0000000000010;
export const Update = /*                */ 0b0000000000100;
export const PlacementAndUpdate = /*    */ 0b0000000000110;
export const Deletion = /*              */ 0b0000000001000;
```

### Renderer（渲染 器）

Renderer 根据 Reconciler 在虚拟 DOM 上打的标记，`同步执行`对应的 DOM 操作，这个过程不可被打断。

## 为什么要引入 fiber

React16 将递归的`无法中断的同步更新`重构为`异步的可中断更新`，由于曾经用于递归的虚拟 DOM 数据结构已经无法满足需要。于是，全新的 Fiber 架构应运而生

### 什么是 fiber

Fiber 其实指的是一种数据结构，它可以用一个纯 JS 对象来表示：

```js
const fiber = {
    stateNode,    // 节点实例
    child,        // 子节点
    sibling,      // 兄弟节点
    return,       // 父节点
}
```

`react fiber` 没法缩短整颗树的渲染时间，但它使得渲染过程被分成一小段、一小段的，相当于有了“保存工作进度”的能力，js 每渲染完一个单元节点，就让出主线程，丢给浏览器去做其他工作，然后再回来继续渲染，依次往复，直至比较完成，最后一次性的更新到视图上。

### fiber 的数据结构

为了能拆分成上面的单元任务，我们需要一种新的数据结构——fiber 链表，例如我们要渲染如下元素：

```js
React.render(
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

它被转化成的 fiber 链表的结构如下：
![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/57137a19680747a985cdf30b90427ad8~tplv-k3u1fbpfcp-zoom-in-crop-mark:1304:0:0:0.awebp?)

- 我们用 fiber 来代指一个要处理的单元任务，如：上面的一个 h1 就是一个 fiber
- 几乎每一个 fiber 都有 3 个指针，所以每个 fiber 都可以找到它的父、子、兄弟元素（这也是渲染可以中断的原因）
- 每当渲染完一个 fiber，performUnitOfWork 都会返回下一个待处理的 fiber，浏览器闲时就会去处理下一个 fiber，以此循环
- 遍历的顺序如下：
  - 从顶点开始遍历
  - 如果有第一个儿子，先遍历第一个儿子
  - 如果没有第一个儿子，标志着此节点遍历完成，然后去找叔叔
  - 如果没有叔叔，则返回父节点，再找父节点的叔叔，若还没有，则一直往上递归
  - 往上找时，没有父节点遍历结束

React 目前的做法是使用链表，每个 VirtualDOM 节点内部表示为一个 Fiber

例如：

- 当前渲染了 `div`，那么下一个要处理的就是 `h1 fiber`
- 如果 `child fiber` 不存在，如 `p fiber`，则下一个要处理的是兄弟 `a fiber`
- 如果 `child fiber` 和兄弟 `fiber` 都不存在，如：`a fiber`，则往上找叔叔 `fiber`，即 `h2 fiber`

### 为何 fiber 这种结构可被中断

对于 v16 之前的 dom 递归，假设遍历发生了中断，虽然可以保留当下进行中节点的索引，下次继续时，我们的确可以继续遍历该节点下面的所有子节点，但是没有办法找到其父节点——因为每个节点只有其子节点的指向。断点没有办法恢复，只能从头再来一遍。以该树为例：

![](https://mmbiz.qpic.cn/mmbiz_png/cpWiaicnZTaua9skyECBhK8fmn4VYgeH2AcV58DPcjH4HYcLf7ZMwXjBXQ4vyg5GFZpuBfpmRjkVfcDKSbdk7lAw/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

在遍历到节点 2 时发生了中断，我们保存对节点 2 的索引，下次恢复时可以把它下面的 3、4 节点遍历到，但是却无法找回 5、6、7、8 节点。

![](https://mmbiz.qpic.cn/mmbiz_png/cpWiaicnZTaua9skyECBhK8fmn4VYgeH2AhanHpDdsPw9A2GIt1H8kbmBlPfc4td6etg3ibjaOic0BZzVl4ew6uz2A/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

在新的架构中，每个节点有三个指针：分别指向第一个子节点、下一个兄弟节点、父节点。这种数据结构就是 fiber，它的遍历规则如下：

从根节点开始，依次遍历该节点的子节点、兄弟节点，如果两者都遍历了，则回到它的父节点；
当一个节点的所有子节点遍历完成，才认为该节点遍历完成；
根据这个规则，同样在图中标出了节点遍历完成的顺序。跟树结构对比会发现，虽然数据结构不同，但是节点的遍历开始和完成顺序一模一样。不同的是，当遍历发生中断时，只要保留下当前节点的索引，断点是可以恢复的——因为每个节点都保持着对其父节点的索引。

![](https://mmbiz.qpic.cn/mmbiz_png/cpWiaicnZTaua9skyECBhK8fmn4VYgeH2ATfic9Tp6vWsohm1gTeUcADSCB1zTmUQHuKRtN1AcIBTnib0MRQ4wYjMg/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

同样在遍历到节点 2 时中断，fiber 结构使得剩下的所有节点依旧能全部被走到。

这就是 react fiber 的渲染可以被中断的原因。树和 fiber 虽然看起来很像，但本质上来说，一个是树，一个是链表。

---
参考：

- [有 React fiber，为什么不需要 Vue fiber？](https://mp.weixin.qq.com/s/K8mHbIwR6NMaIrutDzg61A)
- [Fiber 的深度理解](https://mp.weixin.qq.com/s/kQJ2YVQ2dn-4STFosriLzw)