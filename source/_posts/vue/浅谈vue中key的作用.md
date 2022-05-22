---
title: 浅谈vue中key的作用
date: 2020-06-12 10:06:27
tags: vue
categories: vue
---
## 举一个例子
例如：data数组从 [1,2,3] 变成了 [1,3]，也就是删除了中间的2，vue会如何处理？

## v-for不加key
![](./1.jpg)
注意看图中的绿色正方形没有被删除,原因很简单，你认为你删除了2，但Vue会认为你做了两件事：把2变成了3，然后把3删除了。
所以发现，此时vue的diff对比的过程如下：
首先对比 1 和 1，发现「1 没变」；然后对比 2 和 3发现「2 变成了 3」；最后对比 undefined 和 3，发现「3 被删除了」。

## v-for加key
![](./2.jpg)
注意，这次vue把中间的2删除了，diff的过程详情参考后续对diff算法介绍的文章，但简单的讲，就是会先对比：
1.新头和旧头
2.新尾和旧尾
这里两步已经识别了，1，3相同，然后移动指针后移，发现对比结束，并删除多余的2
[1,2,3]-->[1,3]


## 为什么v-for不使用index做为key
如果你用 index 作为 key，那么在删除第二项的时候，index 就会从 1 2 3 变成 1 2（因为 index 永远都是连续的，所以不可能是 1 3），那么 Vue 依然会认为你删除的是第三项。也就是会遇到上面一样的 bug。
注意看官网中的demo，用的是data中的id，而不是v-for的index
```js
<div v-for="item in items" v-bind:key="item.id">
  <!-- 内容 -->
</div>
```

## v-if中的key
用 key 管理可复用的元素：
Vue 会尽可能高效地渲染元素，通常会复用已有元素而不是从头开始渲染。这么做除了使 Vue 变得非常快之外，还有其它一些好处。例如，如果你允许用户在不同的登录方式之间切换：
```html
<template v-if="loginType === 'username'">
  <label>Username</label>
  <input placeholder="Enter your username">
</template>
<template v-else>
  <label>Email</label>
  <input placeholder="Enter your email address">
</template>
```
那么在上面的代码中切换 loginType 将不会清除用户已经输入的内容。因为两个模板使用了相同的元素，`<input>` 不会被替换掉——仅仅是替换了它的 placeholder
这样也不总是符合实际需求，所以 Vue 为你提供了一种方式来表达“这两个元素是完全独立的，不要复用它们”。只需添加一个具有唯一值的 key attribute 即可

## v-for中的key
当 Vue 正在更新使用 v-for 渲染的元素列表时，它默认使用“就地更新”的策略。如果数据项的顺序被改变，Vue 将不会移动 DOM 元素来匹配数据项的顺序，而是就地更新每个元素，并且确保它们在每个索引位置正确渲染。

为了给 Vue 一个提示，以便它能跟踪每个节点的身份，从而重用和重新排序现有元素，你需要为每项提供一个唯一 key attribute：
```js
<div v-for="item in items" v-bind:key="item.id">
  <!-- 内容 -->
</div>
```
建议尽可能在使用 v-for 时提供 key attribute，除非遍历输出的 DOM 内容非常简单，或者是刻意依赖默认行为以获取性能上的提升。

因为它是 Vue 识别节点的一个通用机制，key 并不仅与 v-for 特别关联。后面我们将在指南中看到，它还具有其它用途。

## key
key 的特殊 attribute 主要用在 Vue 的虚拟 DOM 算法，在新旧 nodes 对比时辨识 VNodes。如果不使用 key，Vue 会使用一种最大限度减少动态元素并且尽可能的尝试就地修改/复用相同类型元素的算法。而使用 key 时，它会基于 key 的变化重新排列元素顺序，并且会移除 key 不存在的元素。

有相同父元素的子元素必须有独特的 key。重复的 key 会造成渲染错误。

最常见的用例是结合 v-for：
```js
<ul>
  <li v-for="item in items" :key="item.id">...</li>
</ul>
```
它也可以用于强制替换元素/组件而不是重复使用它。当你遇到如下场景时它可能会很有用：

* 完整地触发组件的生命周期钩子
* 触发过渡
例如：
```html
<transition>
  <span :key="text">{{ text }}</span>
</transition>
```
当 text 发生改变时，<span> 总是会被替换而不是被修改，因此会触发过渡。

参考：
[https://www.zhihu.com/question/61064119/answer/766607894](https://www.zhihu.com/question/61064119/answer/766607894)