---
title: 使用n来管理node版本
date: 2019-03-08 18:11:25
tags: node
categories: node
---
业务项目比较多，老项目使用的node版本比较低，为了管理多个版本的node，可以使用n工具来管理
n和nvm工具一样，但比它简洁

安装n
```js
npm install -g n
```

下载特定版本的node
```js
// 会下载node/10.6.0
n 10.6.0
```
下载稳定版本
```js
n stable
```

删除特定版本
```js
n rm 10.6.0
```

切换版本
```js
n

   node/6.10.2
   node/6.11.0
   node/9.4.0
o  node/10.6.0
```
使用特定版本来执行文件
```js
n use 10.6.0 index.js
```

---
若安装某个版本的node失败，发生
```
dyld: initializer function 0x0 not in mapped image for /usr/local/bin/node
```
删除/usr/local/n/versions/node下的所有node版本，然后重新使用n命令安装即可。