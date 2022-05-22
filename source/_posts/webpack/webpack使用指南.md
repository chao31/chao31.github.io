---
title: webpack使用指南
date: 2018-05-07 16:01:35
tags: webpack
categories: webpack
---
## 创建package.json
```js
npm init
```
在项目的根目录中执行这个命令，它会自动创建 `package.json`文件，然后终端会问诸如项目名称，项目描述，作者等信息，可默认回车

## 安装Webpack依赖包
```js
npm install --save-dev webpack
```
这时`package.json`里会增加两个属性：`description`和`devDependencies`
![](./1.png)

## --save-dev 与 --save的区别
* `npm install X`:
会把X包安装到node_modules目录中不会修改package.json,之后运行npm install命令时，不会自动安装X
* `npm install --save-dev *`:使用此命令安装，会将依赖安装到`devDependencies`目录下，该目录下都是开发时需要的依赖,如`npm install --save-dev gulp-uglify`，安装了js的压缩包`gulp-uglify`，而压缩插件只在开发时使用，项目发布后不需要
* `npm install --save *`:会将依赖安装到`description`目录下，该目录下都是发布后也需要的依赖，如`vue`这样的框架，项目发布后依然需要

## -S与-D的区别
```js
// -S会安装再dependencies目录下
npm i -S xxx
// -D会安装在devDependencies目录下
npm i -D xxx
```


## 简单的demo
![](./2.png)

1. `src/index.js`
```js
document.getElementById('title').innerHTML = 'hello webpack';
```

2. `dist/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
<div id="title"></div>
<script src="./js/bundle.js"></script>
</body>
</html>
```

3. `webpack.config.js`
```js
// var path = require('path');
module.exports = {
  entry: __dirname + '/src/index.js',
  output: {
    path: __dirname + '/dist',
    // path: path.resolve(__dirname, 'dist'),
    filename: 'js/bundle.js'
  }
}
```
> 注：`__dirname`是node.js中的一个全局变量，它指向当前执行脚本所在的目录。

4. 执行`webpack`，`/dist/`目录下会打包生成`js/bundle.js`,同时出现警告：
![](./3.jpg)
> 警告提示`mode`没有定义，这是 webpack  4x 引入的，有两个值，`development` 和 `production`，默认是`production`，可以用下面这两种方式指定：
* 执行`webpack --mode development`，而不是执行`webpack`
* 在webpack.config.js中指定mode属性，如：
```js
module.exports = {
  mode: 'development',
  entry: __dirname + '/src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'js/bundle.js'
  }
}
```

5. 配置命令
通过在package.json中配置`script`，如：
```js
"scripts": {
  "build": "webpack --mode development"
}
```
> 就可以用命令 `npm run build` 替代  `webpack --mode development`

## Source Maps
`Source Maps`可以使调试更方便，当定位错误时，可以使编译文件与源文件一一对应，通过配置`webpack.config.js`中的`devtool`属性
```js
module.exports = {
  devtool: 'eval-source-map',
  entry: __dirname + '/src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'js/bundle.js'
  }
}
```
`devtool`有4个值，优缺点如下：

| devtool选项 |  配置结果 |
| ---
| `source-map` | 在一个单独的文件中产生一个完整且功能完全的文件。这个文件具有最好的source map，但是它会减慢打包速度 |
| `cheap-module-source-map` | 在一个单独的文件中生成一个不带列映射的map，不带列映射提高了打包速度，但是也使得浏览器开发者工具只能对应到具体的行，不能对应到具体的列（符号），会对调试造成不便 |
| `eval-source-map`| 使用eval打包源文件模块，在同一个文件中生成干净的完整的source map。这个选项可以在不影响构建速度的前提下生成完整的sourcemap，但是对打包后输出的JS文件的执行具有性能和安全的隐患。在开发阶段这是一个非常好的选项，在生产阶段则一定不要启用这个选项 |
| `cheap-module-eval-source-map` | 这是在打包文件时最快的生成source map的方法，生成的Source Map 会和打包后的JavaScript文件同行显示，没有列映射，和eval-source-map选项具有相似的缺点 |

## 使用webpack构建本地服务器
Webpack提供了一个可选的本地开发服务器，可以让浏览器监听你的代码修改，并自动刷新显示修改后的结果
这个本地服务器基于node.js构建，它是一个单独的组件，在`webpack.config.js`中配置前，需要单独安装
1. `npm install --save-dev webpack-dev-server`
2. 然后配置`devServer`属性：
```js
module.exports = {
  entry: __dirname + '/src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'js/bundle.js'
  },
  devServer: {
    contentBase: "./dist",//本地服务器所加载的页面所在的目录
    historyApiFallback: true,//不跳转
    inline: true,//实时刷新
    port: 8080//设置默认监听端口，如果省略，默认为”8080“
  }
}
```
3. 在`package.json`中的`scripts`对象中添加如下命令，用以开启本地服务器：
```js
  "scripts": {
    "server": "webpack-dev-server --open"
  }
```
在终端中输入 `npm run server`即可在本地的8080端口查看结果
