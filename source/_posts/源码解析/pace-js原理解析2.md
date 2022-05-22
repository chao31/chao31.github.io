---
title: pace.js原理解析（二）
date: 2020-09-25 16:02:55
tags: 源码解析
categories: 源码解析
---
## init

## Pace.sources
Pace.sources = [ ]
push进去4个实例：'ajax', 'elements', 'document', 'eventLag'

### AjaxMonitor
#### RequestIntercept
封装发送ajax请求的XMLHttpRequest，XDomainRequest 的代理 req.open方法调用时，触发了trigger('request')事件
它有两个方法：
一、trigger('request')
req.open方法时触发

二、on('request'）
1.监听req.open方法 
2.遍历Pace.sources里的实例，若是AjaxMonitor的实例，调用其watch ()方法 
3.watch方法会AjaxMonitor.elements.push(XHRRequestTracker) 总结：每发一个ajax请求，AjaxMonitor的elements属性就push进去一个tracker，

#### AjaxMonitor
this.elements = []，里面保存有tracker实例，而tracker有progres属性

#### XHRRequestTracker
监听xhr，request.addEventListener('progress'），根据浏览器是否支持ProgressEvent，算出进度，存储在this.progress 

1.progress事件会在浏览器接收新数据期间周期性地触发。 
2.而onprogress事件处理程序会接收到一个event对象，其target属性是XHR对象 
3.但包含着三个额外的属性：lengthComputable、loaded和total。 
4.lengthComputable：是一个表示进度信息是否可用的布尔值；loaded：表示已经接收的字节数，loaded：表示根据Content-Length响应头部确定的预期字节数 
5.不支持ProgressEvent的浏览器，监听readyState为3、4分别对应50% 、100%

### ElementMonitor
Pace.options.selectors=[]里面存的是要跟踪的doms元素，doms加载都成功，progress=100% 

ElementMonitor实例的this.elements里存着selectors里的dom对应的tracker（每个tracker映射着selectors里的dom），每个tracker都会每隔100ms，查询一次dom是否存在，若是则this.progress = 100

### DocumentMonitor
Document.readyState 属性描述了document 的加载状态 

1.loading:正在加载 
2.interactive:可交互,文档已被解析，"正在加载"状态结束，但是诸如图像，样式表和框架之类的子资源仍在加载。 3. complete（完成）,文档和所有子资源已完成加载。表示 load 状态的事件即将被触发。 

这个三个状态分别对应的进度this.progresss = 0% 、50% 、100%

### EventLagMonitor
1. EventLagMonitor其实只是一个“假的”监视器。它就在那里安静匀速的更新进度，这一小小的措施却带来了不错的用户体验，让用户不会因为加载“卡住了”而慌张 

2. 感觉怎么计算进度是一个数学问题，求一个数组绝对值的和的平均值，大于几小于几时，_this.progress = 100;​（具体见代码）

## new Bar( )
Bar就是进度条dom实例，进度百分比关联着progress的值

setAttribute('data-progress-text', 10%)

```html
/* 如果你不想把content内容在CSS里写死，那你可以使用attr表达式来从页面元素中动态的获取内容 */
.pace-progress:before {content: attr(data-progress-text);​
```

## new Scaler( )
Scaler会取出实例的progress值，Scaler.tick()会将progress值增加一点后返回

Scaler.tick()：此方法主要用于返回this.progress，而progress需要不断增加，计算增加多少的方式很有意思，如果增量算的太多，不太合适，所以（初始progress + 20）和上面计算的progress取个最小值，也就是每次算的增量最大幅度是20（maxProgressPerFrame）

## pace.start( )
主要做一件事，执行bar.render()，也就是插入bar的dom，​如果页面还未加载，则每隔50ms再Pace.start()一次

1.Pace.go()
每隔33ms执行一次runAnimation 
window.performence. now() 比Date.now不同的是，window.performance.now()返回的时间戳没有被限制在一毫秒的精确度内，而它使用了一个浮点数来达到微秒级别的精确度

2.runAnimation( fn )
很有意思的一个函数：33ms后才会执行fn，否则一直等到33ms后；fn函数被执行后，若返回false，会在下一帧继续执行runAnimation（也就是再等33ms执行一次fn），直到返回true
总结：每间隔33ms执行一次fn（fn就是检测所有实例都为done），并在下一帧再次开始33ms递归，直到所有实例都为done​
3.fn
1. 取出所有实例的element，每个element都有一个Scaler实例(否则new一个存起来)，scaler.done表示实例的进度是否完成
2. for循环，done &= scaler.done（ a&=b就是a=a&b，有一个scaler.done不为true，done就不为true）
3.把不为done的实例， 对这些实例取出pregress，求平均进度，avg = sum / count; 再bar.update(avg)更新bar实例的进度
5. 若所有done为true，bar.finish();
 