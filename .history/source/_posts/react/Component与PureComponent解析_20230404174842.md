---
title: Component 与 PureComponent 解析
date: 2023-02-29 13:48:57
tags: react
categories: react
---

## 题外话

有啥不对的请多多指教，研究的不算很深，记录为了分享，也为了博采众长，完善知识。

官方文档

> `React.PureComponent` 与 `React.Component` 很相似。两者的区别在于 `React.Component` 并未实现 `shouldComponentUpdate()`，而 `React.PureComponent `中以浅层对比 `prop` 和 `state` 的方式来实现了该函数。

官方解释也很容易理解，`React.PureComponent` 比 `React.Component` 中多实现了一个方法，就导致了在组件数据发生变化时，`React.PureComponent` 会先进行和上一次的比较，如果相同，就不会再继续更新了。

口说无凭，还是得通过代码来体会。

## 对比

### 先看两者相同得地方

```js
class Box1 extends React.Component {
  render() {
    console.log('Box1 update');
    return <div>Box1: {this.props.count}</div>;
  }
}

class Box2 extends React.PureComponent {
  render() {
    console.log('Box2 update');
    return <div>Box2: {this.props.count}</div>;
  }
}

export default () => {
  const [count, setCount] = React.useState(1);
  console.log('parent update');
  return (
    <div>
      <Box1 count={count}/>
      <Box2 count={count}/>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
};
```

此时，点击 `button` 按钮的时候，上述 2 个 `Box` 组件都会进行更新。
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7ab3786a2c6e4291b42ea0a74c82925f~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)
这也是最基础的组件更新。

### 取消外部数据引入
```js
class Box1 extends React.Component {
  render() {
    console.log('Box1 update');
    return <div>Box1</div>;
  }
}

class Box2 extends React.PureComponent {
  render() {
    console.log('Box2 update');
    return <div>Box2</div>;
  }
}

export default () => {
  const [count, setCount] = React.useState(1);
  console.log('parent update');
  return (
    <div>
      <Box1 />
      <Box2 />
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
};
```

取消 `Box` 组件内对外部 `count` 的引入

此时页面更新为

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6ee68b83f2ab45569330aaff58bee7dc~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

此时会发现只有 `Box1` 重新刷新了一遍，而 `Box2` 未重新加载组件，也就是 `PureComponent` 内部做了浅比较相同的不会进行更新。

### 为什么被称为浅比较

`浅比较`是指对值类型进行比较，而稍微复杂一点的引用类型（Object）,就无法进行判断了，react 内部的更新都是浅比较。

```js
export default () => {
  const [count, setCount] = React.useState({ num: 1 });
  console.log('parent update');
  const click = () => {
    const newCount = count;
    newCount.num = count.num + 1;
    setCount(newCount);
    console.log('update:', count)
  };
  return (
    <div>
      <Box1 />
      <Box2 />
      <button onClick={click}>+1</button>
    </div>
  );
};
```

此时，父组件内部的 count 为对象类型，此时进行更新时，页面不会触发任何更新，父组件也不会进行刷新（由于是引用类型，newCount 发生数据变化时，count 其实已经发生变化，但是页面并不会有任何的反应）。

由图可见，子组件和父组件并没有进行刷新，均未打印。
小知识点
const 的不可变定义也是只对于值类型而言，对于引用类型，还是依然可变。上述代码云清并不会报错。
说明
上述的一切代码都是建立在父组件自身更新的基础上子组件才会刷新，如果我将 setCount(count + 1) 改为 setCount(count + 0),那么，父组件本身不会进行刷新，子组件也就理所当然的不会有任何变化。
另类的不更新
这里的父组件刷新带动子组件刷新有一种例外的情况。代码如下
const Parent = ({ children }) => {
  const [count, setCount] = React.useState(1);

  console.log('parent update');
  return (
    <div>
      {children}
      <button onClick={() => setCount(count + 1)}>box2</button>
    </div>
  );
};

export default () => {
  return (
    <Parent>
      <Box1 />
      <Box2 />
    </Parent>
  );
};
复制代码
将父组件抽离出来，子组件以 children 的形式引入。
此时页面点击发生的变化为

会发现不管怎么点击，只有 Parent 组件进行刷新，子组件全部都毫无反应。
这个原因我不得而知，可能是因为 react 生成 dom 的时候问题，这个等待深入学习后再来解答。
总结
PureComponent 多用于抽取本地缓存制作的下拉框组件或者是根据数据字典生成的展示组件，这种固定的组件基本在用户使用时不会有任何的变化，只在登录和页面加载最开始生成。

作者：别哭 0 摸摸头
链接：https://juejin.cn/post/7205116210078105637
来源：稀土掘金
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。