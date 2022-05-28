---
title: 从 0 到 1 实现 React（一）—— 生成虚拟 dom
date: 2021-08-15 08:00:59
tags: 
  - react
  - 从 0 到 1 系列
categories: react
---
[lesson-01 源码](https://github.com/chao31/react-mini/tree/lesson01)

## 创建一个空项目

创建项目并初始化`package.json`

```bash
mkdir react-mini
npm init -y 
```

### 配置 parcel

因为 parcel 是零配置，所以只需安装上即可，为了大家不会因版本问题导致报错，下面安装命令带上了版本：

```bash
npm i -D parcel-bundler@1.12.3
```

### 新增 index.html 模板

添加 html 代码：

- 根节点 `root`
- 内联的方式引入 一个`index.js`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <title>React-mini</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
  <script src="./index.js"></script>
</html>
```

### 添加入口 index.js

`index.js`里面是一段 JSX 代码

```js
console.log('成功启动');
```

### 增加 script 命令

修改 package.json

```json
"scripts": {
+  "start": "parcel index.html",
},
```

执行 `npm start`，访问`http://localhost:1234/`, 会看到控制台打印`成功启动`

## 如何处理 JSX

### 什么是 jsx？

如下就是一段 JSX 代码 [具体请参考](https://zh-hans.reactjs.org/docs/introducing-jsx.html)

```jsx
const profile = (
  <div className="profile">
    <span className="profile-title">title</span>
    <h3 className="profile-content">content</h3>
  </div>
);
```

接下来要将上面 JSX 代码转化为`虚拟 dom 节点`（后文中将用`vnode`指代`虚拟 dom 节点`），下面代码是将要转换成的`vnode`结构：

<details>
```json
{
  "tag": "div",
  "attrs": {
    "className": "profile"
  },
  "children": [
    {
      "tag": "span",
      "attrs": {
        "className": "profile-title"
      },
      "children": [
        "title"
      ]
    },
    {
      "tag": "h3",
      "attrs": {
        "className": "profile-content"
      },
      "children": [
        "content"
      ]
    }
  ]
}
```
</details>

### 安装 babel 处理 JSX

我们使用`babel-plugin-transform-react-jsx`来转化 jsx，但同时需安装它所需要依赖——`babel-core、 babel-preset-env`，所以整体安装命令如下：

```bash
npm i babel-core babel-preset-env babel-plugin-transform-react-jsx -D
```

然后再根目录添加`.babelrc`文件：

```json
{
  "presets": ["env"],
  "plugins": [
      ["transform-react-jsx", {
          "pragma": "React.createElement"
      }]
  ]
}
```

### 用 JSX 测试

将 index.js 改为一段 JSX
```diff
- console.log('成功启动');

+ const profile = (
+   <div className="profile">
+     <span className="profile-title">title</span>
+     <h3 className="profile-content">content</h3>
+   </div>
+ );
+ console.log('profile: ', profile);
```

打开控制台，会看到如下错误提示：

```js
react-mini.e31bb0bc.js:121 Uncaught ReferenceError: React is not defined
    at Object.parcelRequire.index.js (react-mini.e31bb0bc.js:121:15)
    at newRequire (react-mini.e31bb0bc.js:47:24)
    at react-mini.e31bb0bc.js:81:7
    at react-mini.e31bb0bc.js:120:3
```

点击进入第一行错误定位，会跳转到源码出错的地方—— “React.createElement 未定义”，因为我们还未实现`React.createElement`,所以因找不到该函数而报错

```js
var profile = React.createElement( // 从该行开始报错
  "div", 
  {
    className: "profile"
  }, 
  React.createElement(
    "span", 
    {
      className: "profile-title"
    }, 
    "title"
  ), 
  React.createElement(
    "h3", 
    {
      className: "profile-content"
    }, 
    "content"
  )
);
console.log('profile: ', profile);
// ...
```

从上面代码可以看出，`babel-plugin-transform-react-jsx`做了两件事情：

- 将 JSX 代码转换成了参数，`type, props, ...children`
- 将上面的参数传递给 React.createElement，并执行该函数

```js
React.createElement(
  type,
  [props],
  [...children]
)

// 参数说明：

// - type：标签类型，如：`div`、`span`、`h3`, 
//        也可以是 React 组件 类型（class 组件或函数组件）
// - props: 该标签的属性，如`classname`, 若无则为 null
// - children：第 2、3...个参数，都是子元素，子元素又开始递归调用`React.createElement`
```

所以要完成 JSX 的处理，我们需要实现一下 React.createElement，并通过其生成虚拟 dom 节点

## 生成虚拟 dom 节点

### 实现 React.createElement

使`React.createElement` 返回一个含有 children 的树状结构，就实现了`vnode`

新增一个`react/index.js`文件：

```js
const React = {
  createElement,
};

function createElement(tag, attrs, ...children) {
  return {
    tag,
    attrs,
    children,
  };
}

export default React;
```

在 `index.js` 中引入`react/index`,即可在控制台看到生成的 vnode

```js
+ import React from './react';

const profile = (
  <div className="profile">
    <span className="profile-title">title</span>
    <h3 className="profile-content">content</h3>
  </div>
);
console.log('profile: ', profile);
```

至此，我们已经可以生成虚拟 dom 节点了

[lesson-01 源码参考](https://github.com/chao31/react-mini/tree/lesson01)
