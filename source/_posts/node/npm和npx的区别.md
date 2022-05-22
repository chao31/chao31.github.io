---
title: npm和npx的区别
date: 2019-03-08 17:40:16
tags: node
categories: node
---
## npm
npm是Node.js的软件包管理器，其目标是自动化的依赖性和软件包管理

npm 允许在package.json文件里面，使用scripts字段定义脚本命令

## --save-dev 与 --save的区别
* `npm install X`:
会把X包安装到node_modules目录中不会修改package.json,之后运行npm install命令时，不会自动安装X
* `npm install --save-dev *`:使用此命令安装，会将依赖安装到`devDependencies`目录下，该目录下都是开发时需要的依赖,如`npm install --save-dev gulp-uglify`，安装了js的压缩包`gulp-uglify`，而压缩插件只在开发时使用，项目发布后不需要
* `npm install --save *`:会将依赖安装到`description`目录下，该目录下都是发布后也需要的依赖，如`vue`这样的框架，项目发布后依然需要

## 简写-S与-D的区别
```js
// -S会安装再dependencies目录下
npm i -S xxx
// -D会安装在devDependencies目录下
npm i -D xxx
```

## npx
npx是执行Node软件包的工具，它从 npm5.2版本开始，就与npm捆绑在一起。
如果不能用，手动安装
```js 
npm install -g npx
```

npm与npx执行命令对比：

```js
// 免去了设置路径
npx eslint --init

// 若使用npm
./node_modules/bin/eslint --init

// 或者在package.json设置好scripts脚本 
//{
//  "scripts": {
//    "eslint":"eslint --init"
//  }
//} 
npm run eslint
```
npx 的原理很简单，就是运行的时候，会到node_modules/.bin路径和环境变量$PATH里面，检查命令是否存在

1. 默认情况下，首先检查路径中是否存在要执行的包（即在项目中）；
2. 如果存在，它将执行；
3. 若不存在，意味着尚未安装该软件包，npx将安装其最新版本，然后执行它；

只执行，不安装(若未安装，会报错)
```js
npx some-package --no-install
```