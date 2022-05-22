---
title: quicklink原理解析(一)
date: 2020-07-20 18:03:11
tags: 源码解析
categories: 源码解析
---
## quicklink是什么？
quicklink 是一个通过预加载资源来提升访问速度的轻量级工具库（压缩后< 1KB）,通过提前加载资源，使浏览器加载缓存资源，从而减少请求所消耗的时间，来达到快速打开页面的目的。

## How it works？
* Waits until the browser is idle (using requestIdleCallback)

* Detects links within the viewport (using Intersection Observer)

* Checks if the user isn't on a slow connection (using navigator.connection.effectiveType) or has data-saver enabled (using navigator.connection.saveData)

* Prefetches URLs to the links (using <link rel=prefetch> or XHR). Provides some control over the request priority (can switch to fetch() if supported).

## 如何确定浏览器是否空闲？
如果浏览器支持requestIdleCallback，则使用原生的函数，如果不支持，则使用setTimeout函数做ployfill。

requestIdleCallback：它指定只有当一帧的末尾有空闲时间，才会执行回调函数。一般浏览器的刷新频率是60HZ，也就是说，只有当前帧的运行时间小于16.66ms时，函数fn才会执行。否则，就推迟到下一帧，如果下一帧也没有空闲时间，就推迟到下下一帧，以此类推。
`requestIdleCallback(callback[, timeout])`
1. callback
callback会接收到一个名为callback deadline 的参数，它具有如下属性 :
timeRemaining() 方法返回当前帧还剩余的毫秒。这个方法只能读，不能写，而且会动态更新。因此可以不断检查这个属性，如果还有剩余时间的话，就不断执行某些任务。一旦这个属性等于0，就把任务分配到下一轮requestIdleCallback。
deadline对象的 didTimeout 属性会返回一个布尔值，表示指定的时间是否过期。这意味着，如果回调函数由于指定时间过期而触发

2. timeout
如果在指定 的这段时间之内，每一帧都没有空闲时间，那么函数fn将会强制执行。

## requestIdleCallback 兼容处理
如果浏览器支持requestIdleCallback，则使用原生的函数，如果不支持，则使用setTimeout函数做ployfill。
![](./01.png)

## 如何预加载指定资源？
常见的是通过一些技术手段来实现资源的预加载，例如使用XMLHttpRequest来获取资源并进行缓存。然而，这些技术都是应用层面的，并非Web标准，某些需求也无法准确实现，同时，在性能方面也存在着问题。好在目前已有相关的Web标准——Resource Hint，通过它，可以在浏览器原生层面实现这些功能，同时提供性能保证。

Resource Hint有5种：
* DNS Prefetch
* Preconnect
* Preload
* Prefetch
* Prerender

## DNS Prefetch
DNS解析：查找域名对应的ip，会耗费大量的时间，所以可以利用DNS预解析。

Resource Hint主要通过使用link标签。rel属性确定类型，href属性则指定相应的源或资源URL 。
```html
<link rel="dns-prefetch" href="//yourwebsite.com">
```

## Preconnect
建立连接不仅需要DNS查询，还需要进行TCP协议握手，有些还会有TLS/SSL协议，这些都会导致连接的耗时。因此，使用Preconnect可以帮助你告诉浏览器：“我有一些资源会用到某个源，可以帮我预先建立连接。”
```html
<link rel="preconnect" href="//yourwebsite.com"> 
```
## Prefetch
你可以把Prefetch理解为资源预获取。一般来说，可以用Prefetch来指定在紧接着之后的操作或浏览中需要使用到的资源，让浏览器提前获取。由于仅仅是提前获取资源，因此浏览器不会对资源进行预处理，并且像CSS样式表、JavaScript脚本这样的资源是不会自动执行并应用于当前文档的。
在 Chrome 中，如果用户从一个页面跳转到另一个页面，prefetch 发起的请求仍会进行不会中断。
另外，prefetch 的资源在网络堆栈中至少缓存 5 分钟，无论它是不是可以缓存的。

## Preload
preload 提供了一种声明式的命令，让浏览器提前加载指定资源(加载后并不执行)，需要执行时再执行
这样做的好处在于：
1、将加载和执行分离开，不阻塞渲染和document的onload事件
2、提前加载指定资源，不再出现依赖的font字体隔了一段时间才刷出的情况

此外，preload 不会阻塞 windows 的 onload 事件

Preload的使用注意：
对跨域的文件进行preload时，必须加上 crossorigin 属性
没有用到的 preload 资源在 Chrome 的 console 里会在 onload 事件 3s 后发生警告
![](./02.png)

需要注意的是，和DNS Prefetch、Preconnect使用不太一样的地方是，Prefetch有一个as的可选属性，用来指定获取资源的类型。由于不同的资源类型会具有不同的优先级、CSP、请求头等，因此该属性很重要。

## 浏览器资源的优先级
在Chrome浏览器中，不同的资源在浏览器渲染的不同阶段进行加载的优先级不同

一共分成五个级别

Highest 最高
Hight 高
Medium 中等
Low 低
Lowest 最低

其中主资源HTML和CSS的优先级最高，其他资源根据情况的不同优先级不一，JS脚本根据它们在文件中的位置是否异步、延迟或阻塞获得不同的优先级：
1、网络在第一个图片资源之前阻塞的脚本在网络优先级中是中级
2、网络在第一个图片资源之后阻塞的脚本在网络优先级中是低级
3、异步／延迟／插入的脚本（无论在什么位置）在网络优先级中是很低级

图片（视口可见）将会获得相对于视口不可见图片（低级）的更高的优先级（中级），所以某些程度上 Chrome 将会尽量懒加载这些图片。低优先级的图片在布局完成被视口发现时，将会获得优先级提升

预加载 使用 “as” 属性加载的资源将会获得与资源 “type” 属性所拥有的相同的优先级。比如说，preload as="style" 将会获得比 as=“script” 更高的优先级

不带 “as” 属性的 预加载 的优先级将会等同于异步请求，如果忽略 as 属性，或者错误的 as 属性会使 预加载 等同于 XHR 请求，浏览器不知道加载的是什么，因此会赋予此类资源非常低的加载优先级




