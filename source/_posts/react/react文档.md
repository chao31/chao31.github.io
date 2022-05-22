---
title: React 文档
date: 2020-10-12 10:06:27
tags: react
categories: react
---
## ReactDOM.render的改变

### 挂载dom的改变

- Legacy Root API: 通过`ReactDOM.render`来挂载dom，其工作方式与 React 17 相同，但是会有红色warning警告，提示将被遗弃。

- New Root API：通过`ReactDOM.createRoot`来挂载dom，可以使用`React 18`中的所有新特性。

```js
import * as ReactDOM from 'react-dom';
import App from 'App';

const container = document.getElementById('app');

// React 17
- ReactDOM.render(<App />, container);

// React 18
+ const root = ReactDOM.createRoot(container);
+ root.render(<App />);
```

### 渲染回调的改变

- `React 17` 通过给 render 传递一个回调函数，在组件被渲染或更新后调用；
- `React 18` 通过App 的 props传入回调函数

```js
import * as ReactDOM from 'react-dom';
import App from 'App';

const container = document.getElementById('app');

// React 17
ReactDOM.render(container, <App tab="home" />, function() {
  console.log('rendered').
});

// React 18
const root = ReactDOM.createRoot(container);
root.render(<App callback={() => console.log("renderered")} />);

```
