---
title: quicklink原理解析(二)
date: 2020-07-29 18:03:11
tags: 源码解析
categories: 源码解析
---
## preload和prefetch的区别
1. preload 是告诉浏览器页面必定需要的资源，浏览器一定会加载这些资源，prefetch 是告诉浏览器页面可能需要的资源，浏览器不一定会加载这些资源
2. Prefetch加载优先级非常低，也就是说该方式的作用是加速下一个页面的加载速度
3. Preload 的与众不同还体现在 onload 事件上。也就是说可以定义资源加载完毕后的回调函数 <link rel="preload" href="..." as="..." onload="preloadFinished()">
4. preload 和 prefetch 混用的话，并不会复用资源，而是会重复加载，使用 preload 和 prefetch 的逻辑可能不是写到一起，但一旦发生对用一资源 preload 或 prefetch 的话，会带来双倍的网络请求
5. `<link rel="preload">` 大约有 50% 的支持度，`<link rel="prefetch">` 大约有 70% 的支持度。

## as资源类型
```html
<link rel="prefetch" href="/my.little.script.js" as="script">
```
as：
```html 
<audio>、 <video>、 <script>、 <link rel=stylesheet>、 <img>、 SVG、 XHR, fetch、 <iframe>、	HTML
```

可以看到，Prefetch的可选资源类型非常丰富，除了我们常用的script和style，甚至还包括iframe 、video、img等，基本涵盖了Web中的各类资源。

## Prerender
prerender则是prefetch的更进一步。可以粗略地理解为“预处理”（预执行）。
通过Prerender“预处理”的资源，浏览器都会作为HTML进行处理。浏览器除了会去获取资源，还可能会预处理（MAY preprocess）该资源，而该HTML页面依赖的其他资源，像`<script>`、`<style>`等页面所需资源也可能会被处理。但是预处理会由于浏览器或当前机器、网络情况的不同而被不同程度地推迟。例如，会根据CPU、GPU和内存的使用情况选择不同的策略或阻止该操作。

注意，由于这些预处理操作的不可控性，当你只是需要能够预先获取部分资源来加速后续可能出现的网络请求时，建议使用Prefetch。

## Quicklink的预加载
quicklink通过动态的创建link标签，再为其指定url
要预加载一个资源可以通过下面四行代码：
![](./01.png)

## Resource Hints的兼容处理
quicklink会判断是否支持 Resource Hints 中的 prefetch：link.relList.supports(feature)，<link> dom对象有一个relList属性，它的supports方法可以检测是否支持prefetch

在不支持 Resource Hints 的浏览器中，使用其他方式来预加载资源，所以，quicklink利用浏览器自身的缓存策略，回退使用 XHR 加载，“实实在在”预先请求这个资源
![](./02.png)

## 预加载策略
预加载方式：
第一种：如果传入的options参数中有urls属性，则直接执行预加载urls数组内的资源
第二种：通过document.querySelectorAll方法获取所有a标签元素的NodeList，然后遍历该元素节点列表，并监视该元素节点

有了资源预加载的方式，那么接下来就需要一个预加载的策略了。
这其实是个见仁见智的问题。例如直接给你一个链接 https://my.test.com/somelink，在没有任何背景信息的情况下，恐怕你完全不知道是否需要预加载它。那对于这个问题，quicklink 是怎么解决的呢？或者说，quicklink 是通过什么策略来进行预加载的呢？
quicklink 用了一个比较直观的策略：只对处于视口内的资源进行预加载。这一点也比较好理解，网络上大多的资源加载、页面跳转都伴随着用户点击这类行为，而它要是不在你的视野内，你也就无从点击了。这一定程度上算是个必要条件。
这么一来，我们所要解决的问题就是，如何判断一个链接是否处于可视区域内？

## intersectionobserver
![](./03.png)
IntersectionObserver支持两个参数：
1. callback是当被监听元素的可见性变化时，触发的回调函数
2. options是一个配置参数，可选，有默认的属性值

## intersectionobserver的兼容处理
[Polyfill](https://polyfill.io/v3/url-builder/)是一个js库，主要抚平不同浏览器之间对js实现的差异。比如window.XMLHttpRequest , 大多数浏览器支持，但IE不支持。Polyfill的典型做法是在IE浏览器中增加XHR对象，其内部实现还是使用 ActiveXObject，帮助将这些差异化抹平，不支持的变得支持了。
Polyfill.io 读取每个请求的 User-Agent(UA) 头，并生成适合于该浏览器的 polyfill ，基于你的应用所使用的特性发回必要的代码，polyfill的使用：
1.Features
该参数指定需要 polyfill 的浏览器特性。多个特性名之间用逗号分隔。允许使用的特性明在 浏览器和特性 页中列出。
2.Flags
always - Polyfill 将始终被包含，不管 UA 中指出的浏览器是否已经支持该特性。
gated - 通过特性检测来判断 Polyfill，只有在浏览器原生 API 不支持这些特性的情况下才返回并执行 Polyfill。
![](./04.png)

## 网络状态的获取
Navigator.connection 是只读的，提供一个NetworkInformation 对象来获取设备的网络连接信息。
![](./05.png)
1、downlink： 估算的下行速度/带宽

2、effectiveType： 当前的网络连接类型，其中effectiveType的取值可能是'slow-2g'、'2g'、'3g'或者'4g'。

3、onchange： 回调函数，在网络状态发生改变后执行

4、rtt ：估算的往返时间

5、saveData ：打开/请求数据保护模式

(conn.effectiveType || ‘’).includes(‘2g’) || conn.saveData
effectiveType的取值可能是'slow-2g'、'2g'、'3g'或者'4g’

## quicklink的实现总结
1. new 一个IntersectionObserver对象(提前引入polyfill做兼容)， 检测网页中的链接是否出现在视口中，等待链接出现在视口，执行步骤2。

2. 使用requestIdleCallback等待浏览器空闲后（兼容则是自己模拟的一个setTimeOut），执行3。

3. 判断当前的网络连接是否是2G或者数据保护模式，如果是则停止执行，直接return，如果不是，执行步骤4。

4. 通过resource hint的prefetch或者XHR预加载链接指向的资源。
![](./06.png)



