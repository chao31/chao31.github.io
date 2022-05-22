---
title: 'JavaScript深入——call、apply和bind的底层实现'
date: 2018-06-16 14:15:31
tags: 前端深入
categories: 前端深入
---
### call、apply和bind的区别
1. 三者都是this的绑定，第一个参数都需要传入要绑定的this
1. call和apply的区别是后面的参数，call是一个一个传入，而apply是通过一个数组传入
2. bind会返回一个函数，在需要的地方执行该函数；而call、apply会立即执行

### call的Polyfill
函数都可以调用 call，说明 call 是函数原型上的方法，所有的实例都可以调用。即: `Function.prototype.call`

call的实现需要注意以下几点：
1. 在 call 方法中获取调用call()函数
2. 第一个参数可以不传或传null，此时this默认指向 window
3. 从第二个参数起，可以向call传入不定长的参数
4. 传入 call 的第一个参数是 this 指向的对象，根据隐式绑定的规则，我们知道 obj.foo(), foo() 中的 this 指向 obj;因此我们可以这样调用函数 context.fn(...args),即在上下文对象添加要执行的fn
5. 执行完毕，delete添加的fn属性

Polyfill:
```js
Function.prototype.call2 = function() {
    // 初始化绑定的this对象(context)和参数args
    let [context, ...args] = [...arguments];
    // args没传或传null，绑定window
    !context && (context = window);
    // 将要执行的函数，绑定到context的fn属性上
    context.fn = this;
    // 执行fn
    let result = context.fn(...args); 
    // 删除多余添加的属性
    delete context.fn;
    // 返回结果
    return result;

}
```
测试一下：
```js
// 测试一下
var foo = {
    value: 1
};

function bar(name, age) {
    console.log(name)
    console.log(age)
    console.log(this.value);
}

bar.call2(foo, 'kevin', 18);
// kevin
// 18
// 1
```
bind2的测试没问题了，就可以把它放进prototype.bind，Polyfill的写法：
```js
if (!Function.prototype.bind)
(function(){
  Function.prototype.bind = function() {
    ...
  }
})();
```
### apply的Polyfill
apply与call的实现，只有取参数的方式不同
```js
Function.prototype.apply2 = function(context, args) {
    
    !context && (context = window);
    context.fn = this;
    let result = args ? context.fn(...args) : context.fn(); 
    delete context.fn;
    return result;

}
```
测试一下：
```js
// 测试一下
var foo = {
    value: 1
};

function bar(name, age) {
    console.log(name)
    console.log(age)
    console.log(this.value);
}

bar.apply2(foo, ['kevin', 18]); 
// kevin
// 18
// 1
```
### bind的Polyfill
bind和call的区别就是，返回一个函数，在这个函数里执行fn
```js
Function.prototype.bind2 = function() {
    let [context, ...args] = [...arguments];
    !context && (context = window);
    context.fn = this;

    return function() {  
        let result = context.fn(...args); 
        delete context.fn;
        return result;
    };

}
```
测试一下：
```js
// 测试一下
var foo = {
    value: 1
};

function bar(name, age) {
    console.log(name)
    console.log(age)
    console.log(this.value);
}

var func = bar.bind2(foo, 'kevin', 18); 
func();
// kevin
// 18
// 1
```

[也可以参考MDN的Polyfill](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

