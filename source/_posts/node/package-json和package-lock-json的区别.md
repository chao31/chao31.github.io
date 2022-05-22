---
title: package.json和package-lock.json的区别
date: 2017-08-11 16:16:00
tags: node
categories: node
---
### package.json
package.json文件记录项目中所需要的所有模块

> 当你执行 `npm i`时，nodeJS会从你的package.json中读取所有的dependencies信息，package.json文件只记录你通过npm install方式安装的模块信息，而这些模块所依赖的其他子模块的信息不会记录。

### package-lock.json
package-lock.json文件锁定所有模块的版本号(包括主模块和所有依赖子模块)

> * `package.json`文件只能锁定大版本，即版本号的第一位，不能锁定后面的小版本，你每次npm install时候拉取的该大版本下面最新的版本。所以为了稳定性考虑我们不能随意升级依赖包，而`package-lock.json`就是来解决包锁定不升级问题的。
> * 从npm 5.x开始，项目中采用package-lock.json的方式来锁定依赖的方式来排除自动升级问题，原则上不允许删除以及不允许放入到.gitignore与.npmignore中。
> * 为什么会有lock呢？“锁定依赖”。小王做一个项目，里边用到了node-sass，package.json文件里会有引用：“node-sass”: “^4.9.3”，假设4.9.3是最新版，发版之后，node-sass更新到4.9.4，这时，小张需要修改小王的项目，拉取代码，install，这时，小张拉取的项目的node-sass的版本会自动更新到大版本下的最新版4.9.4，可能这个版本会影响我们之前的功能，就有问题了。这时，lock文件就出现了，npm 5以上install都是走的lock文件版本，只要不是手动更新组件版本，都是不会自动更新依赖的，这就保证了应用程序依赖之间的关系是一致的，兼容的。



### 升级package-lock.json
如果要升级package-lock.json里面的库包，怎么操作呢？
```
npm install packageName 
// 或 
npm install packageName@x.x.x
```

#### ^和~的区别
这里举个例子：
```html
"dependencies": {
  "classnames": "2.2.5",   // 表示安装2.2.5的版本
  "antd": "^3.1.4", // 表示安装3.1.4及以上的版本，但是不安装4.0.0
  "babel-plugin-import": "~1.1.0", // "~1.1.0",表示安装1.1.x的最新版本（不低于1.1.0），但是不安装1.2.x
},
```
> * 指定版本：比如"classnames": "2.2.5"，表示安装2.2.5的版本
> * 波浪号~+指定版本：比如 "babel-plugin-import": "~1.1.0",表示安装1.1.x的最新版本（不低于1.1.0），但是不安装1.2.x，也就是说安装时不改变大版本号和次要版本号
> * ^+指定版本：比如 "antd": "^3.1.4",，表示安装3.1.4及以上的版本，但是不安装4.0.0，也就是说安装时不改变大版本号。 

大多数情况这种向新兼容依赖下载最新库包的时候都没有问题，可是因为npm是开源世界，各库包的版本语义可能并不相同，有的库包开发者并不遵守严格这一原则：相同大版本号的同一个库包，其接口符合兼容要求。这时候用户就很头疼了：在完全相同的一个nodejs的代码库，在不同时间或者不同npm下载源之下，下到的各依赖库包版本可能有所不同，因此其依赖库包行为特征也不同有时候甚至完全不兼容。

因此npm最新的版本就开始提供自动生成package-lock.json功能，为的是让开发者知道只要你保存了源文件，到一个新的机器上、或者新的下载源，只要按照这个package-lock.json所标示的具体版本下载依赖库包，就能确保所有库包与你上次安装的完全一样。