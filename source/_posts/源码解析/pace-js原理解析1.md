---
title: pace.js原理解析（一）
date: 2020-09-23 16:02:55
tags: 源码解析
categories: 源码解析
---
## Pace.js是什么？
Pace能自动监控页面的加载进度，生成进度条。它能够自动监控ajax请求、事件循环延迟、document就绪状态和页面上的元素，并当再次发送ajax请求，也能够重启进度条。
[官网](https://github.hubspot.com/pace/docs/welcome/)

## 特点
1.配置简单
```html
<head>
  <script src="/pace/pace.js"></script>
  <link href="/pace/themes/pace-theme-barber-shop.css" rel="stylesheet" />
</head>
```
2.体积小
pace.js is 4kb minified and gzipped. The themes vary between 0.5 and 4kb.
1000行左右

3.能够自动收集页面4个方面的进度信息，对应着Pace的4个主要Collectors：
- ajax
监听所有页面的ajax请求进度
- Elements
监听dom元素的是否渲染到页面的进度
- Document
监听页面document的加载进度
- Event Lag   
只是一个“假的”监视器。它就在那里安静匀速的更新进度，这一小小的措施却带来了不错的用户体验，让用户不会因为加载“卡住了”而慌张
```js
paceOptions = {
  ajax: false, // disabled
  document: false, // disabled
  eventLag: false, // disabled
  elements: {
    selectors: ['.my-page']
  }
};
```


## 问题
1. 仅仅引入了一个js，业务代码里也没有调用特殊的ajax请求方法，pace是如何监听ajax请求的？
2. 如何监听document文档的载入进度？
3. 怎样为了用户体验实现一个假的进度？
4. 一个页面初始化时，并不止一个ajax请求，多个ajax的进度、document文档载入进度、dom渲染到页面的进度，这么多进度是如何整合成一个总进度的？
5. 例如一个请求，请求时间是不确定的，pace是如何预知请求时长，并生成进度的？

## 解析
请看下一篇
