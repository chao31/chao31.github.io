---
title: Promise——结合源码看的十道题目
date: 2020-08-29 12:21:20
tags: Promise
categories: Promise
---
### 题目1.
```js
const promise = new Promise((resolve, reject) => {
  console.log(1)
  resolve()
  console.log(2)
})
promise.then(() => {
  console.log(3)
})
console.log(4)
```
搞清楚宏任务和微任务的执行顺序（先宏任务，再微任务，以此循环...）[js 宏任务和微任务](https://www.cnblogs.com/wangziye/p/9566454.html)
典型的微任务： Promise、process.nextTick
典型的宏任务：setTimeout

### 题目2.
```js
const promise1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('success')
  }, 1000)
})
const promise2 = promise1.then(() => {
  throw new Error('error!!!')
})

console.log('promise1', promise1)
console.log('promise2', promise2)

setTimeout(() => {
  console.log('promise1', promise1)
  console.log('promise2', promise2)
}, 2000)
```

### 题目3.
```js
const promise = new Promise((resolve, reject) => {
  resolve('success1')
  reject('error')
  resolve('success2')
})

promise
  .then((res) => {
    console.log('then: ', res)
  })
  .catch((err) => {
    console.log('catch: ', err)
  })

```
为什么连续调用了resolve()、reject()、resolve()3次，只有第一个会执行？，从源码中可以看到，不管是resove还是reject，只有value==='pedding',才会执行，而第一次的resolve()已经把状态置成了'fulfilled'，不再是'pedding'，代码如下：
```js
const resolve = value => {
  
  setTimeout(() => {
    // 只有状态是PENDING，才会执行后续
    if (this.state === PENDING) {
      ...
    }
  });
};
```

### 题目4.
```js
Promise.resolve(1)
  .then((res) => {
    console.log(res)
    return 2
  })
  .catch((err) => {
    return 3
  })
  .then((res) => {
    console.log(res)
  })

```

### 题目5.
```js
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    console.log('once')
    resolve('success')
  }, 1000)
})

const start = Date.now()
promise.then((res) => {
  console.log(res, Date.now() - start)
})
promise.then((res) => {
  console.log(res, Date.now() - start)
})
```

### 题目6.
```js
Promise.resolve()
  .then(() => {
    return new Error('error!!!')
  })
  .then((res) => {
    console.log('then: ', res)
  })
  .catch((err) => {
    console.log('catch: ', err)
  })

```

### 题目7.
```js
const promise = Promise.resolve()
  .then(() => {
    return promise
  })
promise.catch(console.error)

```

### 题目8.
```js
Promise.resolve(1)
  .then(2)
  .then(Promise.resolve(3))
  .then(console.log)

```
promise的透传，首先1传了第一个then，但then(fn)函数期待参数fn是个函数，但确传了个数值2，所以promise会如封装一个函数`return (p) => p`,这里p是1，所以就会一直之执行resove(1)透传下去

### 题目9.
```js
Promise.resolve()
  .then(function success (res) {
    throw new Error('error')
  }, function fail1 (e) {
    console.error('fail1: ', e)
  })
  .catch(function fail2 (e) {
    console.error('fail2: ', e)
  })

```
