---
title: vue文档纪要
date: 2020-01-20 15:33:25
tags: vue
categories: vue
---
# 计算属性和侦听器
## 计算属性
### 计算属性的setter
计算属性默认只有 getter，不过在需要时你也可以提供一个 setter：
```js
computed: {
  fullName: {
    // getter
    get: function () {
      return this.firstName + ' ' + this.lastName
    },
    // setter
    set: function (newValue) {
      var names = newValue.split(' ')
      this.firstName = names[0]
      this.lastName = names[names.length - 1]
    }
  }
}
```
现在再运行 `vm.fullName = 'John Doe'` 时，`setter` 会被调用，`vm.firstName` 和 `vm.lastName` 也会相应地被更新

----
# 列表渲染
## 用v-for把一个数组对应为一组元素
```js
this.items = [
  { message: 'Foo' },
  { message: 'Bar' }
];
<li v-for="(item, index) in items">
  {{ index }} - {{ item.message }}
</li>

// 渲染结果：
// 0 - Foo,
// 1 - Bar
```
## 在v-for里使用对象
```js
this.object = {
  title: 'How to do lists in Vue',
  author: 'Jane Doe',
  publishedAt: '2016-04-10'
}

<div v-for="(value, name, index) in object">
  {{ index }}. {{ name }}: {{ value }}
</div>
// 渲染结果
// 1.title: 'How to do lists in Vue',
// 2.author: 'Jane Doe',
// 3.publishedAt: '2016-04-10'
```
-------------------------------------
# 深入了解组件
## 组件注册
### 组件名大小写
我们强烈推荐遵循 W3C 规范中的自定义组件名 (字母全小写且必须包含一个连字符)
```js
Vue.component('my-component-name', { /* ... */ })
```
## 自定义事件
### 事件名
不同于组件和 prop，事件名不存在任何自动化的大小写转换。而是触发的事件名需要完全匹配监听这个事件所用的名称。举个例子，如果触发一个 camelCase 名字的事件：
```js
// 没有效果 
<my-component v-on:my-event="doSomething"></my-component>
this.$emit('myEvent');

<blog-post post-title="hello!"></blog-post>
props: ['postTitle'],
```


-------------------------------------
# 内在
## 深入响应式原理
### 检测变化的注意事项
#### 对于对象
响应式与非响应式：
```js
var vm = new Vue({
  data:{
    a:1
  }
})

// `vm.a` 是响应式的

vm.b = 2
// `vm.b` 是非响应式的
```
给对象添加单个新属性：用`$set`
```js 
this.$set(this.someObject,'b',2)
```
给对象添加多个新属性：直接Object.assign()不会触发响应，需要原对象与要混合进去的对象的 property 一起创建一个新的对象
```js
// 代替 `Object.assign(this.someObject, { a: 1, b: 2 })`
this.someObject = Object.assign({}, this.someObject, { a: 1, b: 2 })
```
#### 对于数组
Vue 不能检测以下数组的变动：
1.当你利用索引直接设置一个数组项时，例如：`vm.items[indexOfItem] = newValue`
2.当你修改数组的长度时，例如：`vm.items.length = newLength`

但$set和数组的splice、shift等方法可以触发：
```js
Vue.set(vm.items, indexOfItem, newValue);
vm.items.splice(indexOfItem, 1, newValue);
```
----
### 异步更新队列
`nextTick`：将回调延迟到下次 DOM 更新循环之后执行，下面是理解`nextTick`的很好的例子：
```js
var vm = new Vue({
  el: '#example',
  data: {
    message: '123'
  }
})
vm.message = 'new message' // 更改数据
vm.$el.textContent === 'new message' // false,因为dom未更新
Vue.nextTick(function () {
  vm.$el.textContent === 'new message' // true，因为dom已更新
})
```