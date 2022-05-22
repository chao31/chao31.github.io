---
title: vue双向绑定原理
date: 2020-11-08 15:49:25
tags: vue
categories: vue
---
本文的双向绑定是简版的vue实现方式，不包含虚拟dom的实现等
原理图：
![](./2.png)
实现：
我们要实现的是将如下代码，最终渲染成dom节点
```html
  <div id="app">
    <input type="text" v-model="text">
    {{ text }}
  </div>
```
```js
var vm = new Vue({
  el: 'app',
  data: {
    text: 'hello world'
  }
})
```
### 1.Vue构造函数的实现
可以通过如下3大步来完成dom的渲染：

1. 添加监听器
2. 遍历dom，编译模板
3. 编译完成后，将dom插入到根节点
```js
function Vue (options) {
  this.data = options.data;
  var data = this.data;
  // 1.添加监听器
  observe(data, this);

  var id = options.el;
  // 2.遍历dom，编译模板
  var dom = nodeToFragment(document.getElementById(id), this);

  // 3.编译完成后，将 dom 插入到根节点
  document.getElementById(id).appendChild(dom); 
}
```

### 2.使用observe，监听data
`observe`方法会枚举每一个`data`，利用`Object.defineProperty`将`data`中的数据全部转换成`getter/setter`，当有新值赋给`data`，就会触发`setter`函数，然后通知`订阅器Dep`有更新
```js
function observe (obj, vm) {
  Object.keys(obj).forEach(function (key) {
    defineReactive(vm, key, obj[key]);
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

### 3.订阅器Dep（依赖收集器）
每个data都拥有一个`订阅器Dep`，`Dep`里面装着很多`订阅者Watcher`，当`订阅器Dep`收到`data`值改变的消息，就会通知所有`watcher`做更新
```js
function Dep () {
  this.subs = []
}

Dep.prototype = {
  // 添加订阅者
  addSub: function(sub) {
    this.subs.push(sub);
  },

  notify: function() {
    // 通知每一个订阅者更新
    this.subs.forEach(function(sub) {
      sub.update();
    });
  }
}

```

### 4.订阅者Watcher
`watcher`和使用该`data`的dom相关联，通过this可以访问该`dom节点`，所以可以通过`watcher`修改dom的文本属性，如，input组件:`this.value = newData`, 文本组件`this.nodeValue = newData`;当订阅器Dep收到data变化，就会通知里面的每一个watch改变dom值

```js
function Watcher (vm, node, name, nodeType) {
  Dep.target = this;
  this.name = name;
  this.node = node;
  this.vm = vm;
  this.nodeType = nodeType;
  this.update();
  Dep.target = null;
}

Watcher.prototype = {
  update: function () {
    this.get();
    // 更新{{}}
    if (this.nodeType == 'text') {
      this.node.nodeValue = this.value;
    }
    // 更新v-model
    if (this.nodeType == 'input') {
      this.node.value = this.value;
    }
  },
  // 获取 data 中的属性值
  get: function () {
    this.value = this.vm[this.name]; // 触发相应属性的 get
  }
}
```

### 4.模板解析器Compile
遍历所有`dom`，分别处理有`v-model`属性的元素节点和`双花括号`的文本节点：
1. 将`data`值赋值给元素节点，如`input`赋值
2. 替换文本节点的`双花括号`
3. 为元素节点如`input`添加`change`事件，当`value`值改变时，更新被关联的`data`(此时双向绑定之一的`view-->model`已完成)
```js
function nodeToFragment (node, vm) {
  var flag = document.createDocumentFragment();
  var child;
  // 许多同学反应看不懂这一段，这里有必要解释一下
  // 首先，所有表达式必然会返回一个值，赋值表达式亦不例外
  // 理解了上面这一点，就能理解 while (child = node.firstChild) 这种用法
  // 其次，appendChild 方法有个隐蔽的地方，就是调用以后 child 会从原来 DOM 中移除
  // 所以，第二次循环时，node.firstChild 已经不再是之前的第一个子元素了
  while (child = node.firstChild) {
    compile(child, vm);
    flag.appendChild(child); // 将子节点劫持到文档片段中
  }

  return flag
}

function compile (node, vm) {
  var reg = /\{\{(.*)\}\}/;
  // 节点类型为元素
  if (node.nodeType === 1) {
    var attr = node.attributes;
    // 解析属性
    for (var i = 0; i < attr.length; i++) {
      if (attr[i].nodeName == 'v-model') {
        var name = attr[i].nodeValue; // 获取 v-model 绑定的属性名
        node.addEventListener('input', function (e) {
          // 给相应的 data 属性赋值，进而触发该属性的 set 方法
          vm[name] = e.target.value;
        });
        node.value = vm[name]; // 将 data 的值赋给该 node
        node.removeAttribute('v-model');
      }
    };

    new Watcher(vm, node, name, 'input');
  }
  // 节点类型为 text
  if (node.nodeType === 3) {
    if (reg.test(node.nodeValue)) {
      var name = RegExp.$1; // 获取匹配到的字符串
      name = name.trim();

      new Watcher(vm, node, name, 'text');
    }
  }
}
```

附上一副官网流程图：
![](./1.png)

参考：

1. [vue双向绑定原理](https://juejin.cn/post/6844903616046710791#comment)
2. [Vue数据双向绑定](https://juejin.cn/post/6844903942254510087#heading-11)
3. [解析vue双向绑定原理](https://juejin.cn/post/6844904185373130759#heading-3)
4. [完整代码](https://github.com/bison1994/two-way-data-binding)

