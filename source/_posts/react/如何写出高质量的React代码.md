---
title: 如何写出高质量的 React 代码
date: 2021-04-10 18:03:29
tags: react
categories: react
---

## 样式与 CSS

### style

👎🏼 👎🏼 👎🏼：不推荐将 `style` 作为设置样式的主要方式，一般用在`动态计算样式`的时候

👍🏽 👍🏽 👍🏽：推荐在多数情况下使用`className`属性，从性能角度来说，CSS 的 class 通常比行内样式更好。


### 当 `className` 条件判断较多时

通过引入[classnames](https://www.npmjs.com/package/classnames#usage-with-reactjs)来简化自己的代码

```bash
npm install classnames
```

Usage:

```js
import classNames from 'classnames';

class Button extends React.Component {
  // ...
  render () {
    const { isHovered, buttonType } = this.state;
    var btnClass = classNames({
      btn: true,
      isHovered,
      [`btn-${buttonType}`]: true,
    });

    return <button className={btnClass}></button>;
  }
}
```
