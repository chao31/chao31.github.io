---
title: vue3中双向绑定的实现
date: 2020-12-25 13:48:57
tags: vue
categories: vue
---
vue3的双向绑定改变，用一句话来描述：vue3的双向绑定原理由`Object.defineProperty`改为基于ES6的`Proxy`代理来实现。

### 为什么要替换Object.defineProperty
1. vue官网在[深入响应式原理](https://cn.vuejs.org/v2/guide/reactivity.html#%E6%A3%80%E6%B5%8B%E5%8F%98%E5%8C%96%E7%9A%84%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)中解释，由于 JavaScript 的限制，Vue 不能检测数组和对象的变化，也就是：
* 对象属性的添加和删除，无法监听
* 数组索引和长度的变更，无法监听

2. vue2.x为了给每个属性添加setter/getter，会递归调用，而Proxy能劫持整个对象，相比而言更高效

### Proxy和Reflect
Proxy可以理解为“拦截”目标对象，外界对该对象的访问都会拦截，因此可以对外界的访问进行过滤和改写。
Reflect可以理解为一个方法的集合，一些明显属于语言层面的方法，被放到了Reflect上。现阶段，某些方法同时在Object和Reflect上部署，但未来一些新方法只在Reflect上部署。
```js
var obj = {
    name: 123,
    arr: [1,2,3]
};
// target：源对象，这里是obj
// key：属性，如name、arr
// value: get方法，设置的新值
// receiver: 返回的proxy对象，这里是p
var p = new Proxy(obj, {
    get(target, key, receiver) {
        console.log('get:', target, key, receiver);
        // 通过Reflect，调用默认get方法
        return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
        console.log('set:', target, key, value, receiver);
        // 通过Reflect，调用默认set方法
        return Reflect.set(target, key, value, receiver)
    }
});
p.name = 456;
p.name;
```
### 实现
在上一篇《vue双向绑定原理》的基础上，重写监听器observe，上一篇observe的实现如下：
```js
function observe ($data, vm) {
  Object.keys($data).forEach(function (key) {
    defineReactive(vm, key, $data[key]);
  })
}

function defineReactive (obj, key, val) {
  var dep = new Dep();

  Object.defineProperty(obj, key, {
    get: function () {
      // 添加订阅者 watcher 到主题对象 Dep
      if (Dep.target) dep.addSub(Dep.target);
      return val
    },
    set: function (newVal) {
      if (newVal === val) return
      val = newVal;
      // 作为发布者发出通知
      dep.notify();
    }
  });
}
```
使用Proxy数据劫持的方式来实现：
```js
observe(data) {
  const that = this;
  let handler = {
   get(target, property) {
      return target[property];
    },
    set(target, key, value) {
      let res = Reflect.set(target, key, value);
      that.subscribe[key].map(item => {
        item.update();
      });
      return res;
    }
  }
  this.$data = new Proxy(data, handler);
}
```
这段代码里把代理器返回的对象代理到this.$data，即this.$data是代理后的对象，外部每次对this.$data进行操作时，实际上执行的是这段代码里handler对象上的方法。

参考：
1. [vue3中的双向绑定 proxy](https://www.cnblogs.com/lyt0207/p/12540091.html)
2. [vue3.0中的双向数据绑定方法](https://www.cnblogs.com/mlw1814011067/p/11283528.html)