---
title: 如何写出高质量的 React 代码
date: 2021-04-10 18:03:29
tags: react
categories: react
---

`vue` 和 `react` 都已经全面进入了 `hooks` 时代（在 vue 中也称为`组合式 api`，为了方便后面统一称为 `hooks`），然而受到以前 `react` 中类组件和 `vue2` 写法的影响，很多开发者都不能及时转换过来，以致于开发出一堆面条式代码，整体的代码质量反而不如改版以前了。

`hooks` 组件到底应该如何写，我也曾为此迷惘过一段时间。特别我以前以 react 开发居多，但在转到新岗位后又变成了使用 `vue3` 开发，对于两个框架在思维方式和写法的不同上，很是花了一段时间适应。好在几个月下来，我发现二者虽然在写法上有区别之处，但思想上却大同小异。

所以在比较了两个框架的异同后，我总结出了一套通用的 `hooks api` 的抽象方式，在这里分享给大家。如果您有不同意见欢迎在评论区指正。

## 概述

一个组件内部的所有代码——无论 `vue` 还是 `react`——都可以抽象成以下几个部分：

1. 组件视图，组件中用来描述视觉效果的部分，如 `css` 和 `html`、`react` 的 `jsx` 或者 `vue` 的 `template` 代码
2. 组件交互逻辑，如组件生命周期，按钮交互，事件等
3. 业务逻辑，如登录注册，获取用户信息，获取商品列表等与组件无关的业务抽象

单独拆分这三块并不难，难的是一个组件可能写得特别复杂，里面可能包含了多个视图，每个视图相互之间又有交互；同时又可能包含多个业务逻辑，多个业务的函数和变量杂乱无章地随意放置，导致后续维护的时候要在代码之间反复横跳。

要写出高质量的组件，可以思考以下几个问题：

### 组件什么时候拆？怎么拆？

一个常见的误区是，只有需要复用的时候才去拆分组件，这种看法显然过于片面了。你可以思考一下，自己是如何抽象一个函数的，你只会在代码需要复用的时候才抽出一个函数吗？显然不是。因为函数不仅有代码复用的功能，还具有一定的描述性质以及代码封闭性。这种特性使得我们看到一个函数的时候，不必关注代码细节，就能大概知道这部分代码是干啥的。

我们还可以再用函数将一部分函数组合起来，形成更高层级的抽象。按国内流行的说法，高层级的抽象被称为粗粒度，低层级的抽象被称为细粒度，不同粗细粒度的抽象可以称它们为不同的抽象层级。并且一个理想的函数内部，一般只会包含同一抽象层级的代码。

组件的拆分也可以遵循同样的道理。我们可以按照当前的结构或者功能、业务，将组件拆分为功能清晰且单一、与外部耦合程度低的组件 (即所谓高内聚，低耦合)。如果一个组件里面干了太多事，或者依赖的外部状态太多，那么就不是一个容易维护的组件了。

![](https://chao31.github.io/pics/img/202304061711040.png)

然而，为了保持组件功能单一，我们是不是要将组件拆分得特别细才可以呢？事实并非如此。因为上面说过，抽象是有粗细粒度之分的，也许一个组件从较细的粒度来讲功能并不单一，但是从较粗的粒度来说，可能他们的功能就是单一的了。例如登录和注册是两个不同的功能，但是你从更高层级的抽象来看，它们都属于用户模块的一部分。

所以是否要拆分组件，最关键还是得看复杂度。如果一个页面特别简单，那么不进行拆分也是可以，有时候拆分得过于细可能反而不利于维护。

如何判断一个组件是否复杂？恐怕这里不能给出一个准确的答案，毕竟代码的实现方式千奇百怪，很难有一个机械的标准评判。但是我们不妨站在第三方角度看看自己的代码，如果你是一个工作一年的程序员，是否能比较容易地看懂这里的代码？如果不能就要考虑进行拆分了。如果你非要一个机械的判断标准，我建议是代码控制在 200 行内。

总结一下，拆分组件的时候可以参考下面几个原则：

1. 拆分的组件要保持功能单一。即组件内部代码的代码都只跟这个功能相关；
2. 组件要保持较低的耦合度，不要与组件外部产生过多的交互。如组件内部不要依赖过多的外部变量，父子组件的交互不要搞得太复杂等等。
3. 用组件名准确描述这个组件的功能。就像函数那样，可以让人不用关心组件细节，就大概知道这个组件是干嘛的。如果起名比较困难，考虑下是不是这个组件的功能并不单一。

### 如何组织拆分出的组件文件？

拆分出来的组件应该放在哪里呢？一个常见的错误做法是一股脑放在一个名为 `components` 文件夹里，最后搞得这个文件夹特别臃肿。我的建议是相关联的代码最好尽量聚合在一起。

为了让相关联的代码聚合到一起，我们可以把页面搞成文件夹的形式，在文件夹内部存放与当前文件相关的组成部分，并将表示页面的组件命名为 `index` 放在文件夹下。再在该文件夹下创建 `components` 目录，将组成页面的其他组件放在里面。

如果一个页面的某个组成部分很复杂，内部还需要拆分成更细的多个组件，那么就把这个组成部分也做成文件夹，将拆分出的组件放在这个文件夹下。

最后就是组件复用的问题。如果一个组件被多个地方复用，就把它单独提取出来，放到需要复用它的组件们共同的抽象层级上。如下：

1. 如果只是被页面内的组件复用，就放到页面文件夹下。
2. 如果只是在当前业务场景下的不同页面复用，就放到当前业务模块的文件夹下。
3. 如果可以在不同业务场景间通用，就放到最顶层的公共文件夹，或者考虑做成组件库。

关于项目文件的组织方式已经超过本文讨论的范畴，我打算放到以后专门出一篇文章说下如何组织项目文件。这里只说下页面级别的文件如何进行组织。下面是我常用的一种页面级别的文件的组织方式：

```js
homePage // 存放当前页面的文件夹
    |-- components // 存放当前页面组件的文件夹
        |-- componentA // 存放当前页面的组成部分 A 的文件夹
            |-- index.(vue|tsx) // 组件 A
            |-- AChild1.(vue|tsx) // 组件 a 的组成部分 1
            |-- AChild2.(vue|tsx) // 组件 a 的组成部分 2
            |-- ACommon.(vue|tsx) // 只在 componentA 内部复用的组件
        |-- ComponentB.(vue|tsx) // 当前页面的组成部分 B
        |-- Common.(vue|tsx) // 组件 A 和组件 B 里复用的组件
    |-- index.(vue|tsx) // 当前页面
```

实际上这种组织方式，在抽象意义上并不完美，因为通用组件和页面组成部分的组件并没有区分开来。但是一般来说，一个页面也不会抽出太多组件，为了方便放到一起也不会有太大问题。但是如果你的页面实在复杂，那么再创建一个名为 common 的文件夹也未尝不可。

### 如何用 hooks 抽离组件逻辑？

在 `hooks` 出现之前，曾流行过一个设计模式，这个模式将组件分为无状态组件和有状态组件（也称为展示组件和容器组件），前者负责控制视觉，后者负责传递数据和处理逻辑。但有了 `hooks` 之后，我们完全可以将容器组件中的代码放进 `hooks` 里面。后者不仅更容易维护，而且也更方便把业务逻辑与一般组件区分开来。

在抽离 `hooks` 的时候，我们不仅应该沿用一般函数的抽象思维，如功能单一，耦合度低等等，还应该注意组件中的逻辑可分为两种：组件交互逻辑与业务逻辑。如何把文章开头说的视图、交互逻辑和业务逻辑区分开来，是衡量一个组件质量的重要标准。

以一个用户模块为例。一个包含查询用户信息，修改用户信息，修改密码等功能的 `hooks` 可以这样写：

```js
// 用户模块 hook
const useUser = () => {
    // react 版本的用户状态
    const user = useState({});
    // vue 版本的用户状态
    const userInfo = ref({});
    
    // 获取用户状态
    const getUserInfo = () => {}
    // 修改用户状态
    const changeUserInfo = () => {};
    // 检查两次输入的密码是否相同
    const checkRepeatPass = (oldPass，newPass) => {}
    // 修改密码
    const changePassword = () => {};
    
    return {
        userInfo,
        getUserInfo,
        changeUserInfo,
        checkRepeatPass,
        changePassword,
    }
}
```

交互逻辑的 `hook` 可以这么写 (为了方便只写 `vue` 版本的，大家应该也都看得懂):

```js
// 用户模块交互逻辑 hooks
const useUserControl = () => {
    // 组合用户 hook
    const { userInfo, getUserInfo, changeUserInfo, checkRepeatPass, changePassword } = useUser();
    // 数据查询 loading 状态
    const loading = ref(false);
    // 错误提示弹窗的状态
    const errorModalState = reactive({
        visible: false, // 弹窗显示/隐藏
        errorText: '',  // 弹窗文案
    });
    
    // 修改密码表单提交
    const onChangePassword = ({ oldPass, newPass ) => {
        // 判断两次密码是否一致
        if (checkRepeatPass(oldPass, newPass)) {
            changePassword();
        } else {
            errorModalState.visible = true;
            errorModalState.text = '两次输入的密码不一致，请修改'
        }
    };
    
    // 初始化数据
    const initData = () => {
        getUserInfo();
    }
    // 初始化数据，react 使用 useEffect
    onMounted(initData);
    return {
        // 用户数据
        userInfo,
        // 修改密码
        onChangePassword,
        // 修改用户信息
        onChangeUserInfo: changeUserInfo,
    }
}
```

然后只要在组件里面引入交互逻辑的 `hook` 即可：

`vue` 版本：

```js
<template>
    <!-- 视图部分省略，在对应btn处引用onChangePassword和onChangeUserInfo即可 -->
</template>
<script setup>
import useUserControl from './useUserControl';

const { userInfo, onChangePassword, onChangeUserInfo } = useUserControl();
<script>

```

`react` 版本：

```js
import useUserControl from './useUserControl';

const UserModule = () => {
    const { userInfo, onChangePassword, onChangeUserInfo } = useUserControl();
    return (
        // 视图部分省略，在对应 btn 处引用 onChangePassword 和 onChangeUserInfo 即可
    )
}
```

而拆分出的三个文件放在组件同级目录下即可；如果拆出的 `hooks` 较多，可以单独开辟一个 `hooks` 文件夹。如果有可以复用的 `hooks`，参考组件拆分里面分享的方法，放到需要复用它的组件们共同的抽象层级上即可。

可以看到抽离出 `hooks` 逻辑后，组件变得十分简单、容易理解，我们也实现了各个部分的分离。不过这里还有一个问题，那就是上面的业务场景实在太过简单，有必要拆分得这么细，搞出三个文件这么复杂吗？

针对逻辑并不复杂的组件，我个人觉得全部都放进一个文件里面并无不可。而且为了方便，我们还可以进一步简化，只把业务逻辑封装成 `hooks`，而组件的交互逻辑就直接放在组件里面。

下面是用一个文件同时存放视图、组件交互逻辑和业务逻辑的推荐写法：

```html
<template>
    <!-- 视图部分省略，在对应 btn 处引用 changePassword 和 changeUserInfo 即可 -->
</template>
<script setup>
import { onMounted } from 'vue';
// 组件业务逻辑，封装成 hooks
// 用户模块 hooks
const useUser = () => { 
    // 代码省略
}
const { userInfo, getUserInfo, changeUserInfo, checkRepeatPass, changePassword } = useUser();

// 组件交互逻辑，直接写在组件里面
// 数据查询 loading 状态
const loading = ref(false);
// 错误提示弹窗的状态
const errorModalState = reactive({
    visible: false, // 弹窗显示/隐藏
    errorText: '', // 弹窗文案
});

// 修改密码表单提交
const onChangePassword = ({ oldPass, newPass ) => {};
    
// 初始化数据
const initData = () => { getUserInfo(); }
onMounted(initData);
<script>
```

但是如果逻辑比较复杂，或者一个组件里面包含多个复杂业务或者复杂交互，需要抽离出多个 hooks 的情况，还是单独抽出一个个文件比较好。总而言之，依据代码复杂度，选择相对更容易理解的写法。

也许单独一个组件，你并不能体会出 hooks 写法的优越性。但当你封装出更多的 hooks 之后，你会逐渐发现这样写的好处。正因为不同的业务和功能被封装在一个个 hooks 里面，彼此互不干扰，业务才能更容易区分和理解。对于项目的可维护性和可读性提升是非常之大的。

下图展示了 vue2 写法和 vue3 hooks 写法的区别。图中相同颜色的代码块代表这些代码是属于同一个功能的，但 vue2 的写法导致本来是相同功能的代码，却被拆散到了不同地方（react 其实也容易有相同的问题，例如当一个组件有多个功能时，不同功能的代码也很容易混杂到一起）。而通过封装成一个个 hooks，相关联的代码就很容易被聚合到了一起，且和其他功能区分开了。

## 题外话：全局状态的管理

现在的前端项目还有一个较为常见的误区，那就是全局状态管理库（即 `redux`、`vuex` 等）的滥用。依据抽象层级的思维，实际上很多项目并不需要放较多的状态到全局，这种情况利用 `react` 和 `vue` 自身的状态管理就足够了。

如果非要用状态管理库，也要警惕放较多状态和函数到全局。一个状态是否要放到全局，我一般有两个判断标准：

状态是否在多个页面间共享；

跳转页面后又返回该页面，是否需要还原跳转之前的状态（仅对 `react` 而言，`vue `有 `keep-alive`）

而全局状态管理库中的函数，则只放置与全局状态有关的逻辑。除此之外的状态，一律交由 `react` 和 `vue` 组件本身进行管理。


## 其它

### 样式与 CSS

#### style

👎🏼 👎🏼 👎🏼：不推荐将 `style` 作为设置样式的主要方式，一般用在`动态计算样式`的时候

👍🏽 👍🏽 👍🏽：推荐在多数情况下使用`className`属性，从性能角度来说，CSS 的 class 通常比行内样式更好。


#### 当 `className` 条件判断较多时

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

[参考](https://juejin.cn/post/7123961170188304391)