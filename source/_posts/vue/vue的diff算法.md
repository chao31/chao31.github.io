---
title: vue的diff算法
date: 2020-10-09 15:13:02
tags: vue
categories: vue
---
## 什么是diff算法
要知道渲染真实DOM的开销是很大的，比如有时候我们修改了某个数据，如果直接渲染到真实dom上会引起整个dom树的重绘和重排，有没有可能我们只更新我们修改的那一小块dom而不要更新整个dom呢？diff算法能够帮助我们。

我们先根据真实DOM生成一颗virtual DOM，当virtual DOM某个节点的数据改变后会生成一个新的Vnode，然后Vnode和oldVnode作对比，发现有不一样的地方就直接修改在真实的DOM上，然后使oldVnode的值为Vnode。

diff的过程就是调用名为patch的函数，比较新旧节点，一边比较一边给真实的DOM打补丁。

## virtual DOM
虚拟dom的节点属性如下：
```js
{
  sel: 'div', // 选择器，是什么标签
  key: 'A', // key
  children: [], // 子元素
  text: '文本', // 文本节点
  elem: el // 关联真实dom
}
```

## diff的主要流程
![](./01.png)

## patch
来看看patch是怎么打补丁的（代码只保留核心部分）
```js
function patch (oldVnode, vnode) {
    if (sameVnode(oldVnode, vnode)) {
      // 相同节点（值得比较）
        patchVnode(oldVnode, vnode)
    } else {
      // 不同节点（暴力删除，替换新的，不复用）

        const oEl = oldVnode.el // 当前oldVnode对应的真实元素节点
        let parentEle = api.parentNode(oEl)  // 父元素
        createEle(vnode)  // 根据Vnode生成新元素
        if (parentEle !== null) {
            api.insertBefore(parentEle, vnode.el, api.nextSibling(oEl)) // 将新元素添加进父元素
            api.removeChild(parentEle, oldVnode.el)  // 移除以前的旧元素节点
            oldVnode = null
        }
    }
    // some code 
    return vnode
}
```
patch函数接收两个参数oldVnode和Vnode分别代表新的节点和之前的旧节点

判断两节点是否值得比较，值得比较则执行patchVnode

```js
function sameVnode (a, b) {
  return (
    a.key === b.key &&  // key值
    a.tag === b.tag &&  // 标签名
    a.isComment === b.isComment &&  // 是否为注释节点
    // 是否都定义了data，data包含一些具体信息，例如onclick , style
    isDef(a.data) === isDef(b.data) &&  
    sameInputType(a, b) // 当标签是<input>的时候，type必须相同
  )
}
```

不值得比较则用Vnode替换oldVnode
如果两个节点都是一样的，那么就深入检查他们的子节点。如果两个节点不一样那就说明Vnode完全被改变了，就可以直接替换oldVnode。

虽然这两个节点不一样但是他们的子节点一样怎么办？别忘了，diff可是逐层比较的，如果第一层不一样那么就不会继续深入比较第二层了。（我在想这算是一个缺点吗？相同子节点不能重复利用了...）

## patchVnode
当我们确定两个节点值得比较之后我们会对两个节点指定patchVnode方法。那么这个方法做了什么呢？
```js
patchVnode (oldVnode, vnode) {
    const el = vnode.el = oldVnode.el
    let i, oldCh = oldVnode.children, ch = vnode.children
    if (oldVnode === vnode) return
    if (oldVnode.text !== null && vnode.text !== null && oldVnode.text !== vnode.text) {
        api.setTextContent(el, vnode.text)
    }else {
        updateEle(el, vnode, oldVnode)
        if (oldCh && ch && oldCh !== ch) {
            updateChildren(el, oldCh, ch)
        }else if (ch){
            createEle(vnode) //create el's children dom
        }else if (oldCh){
            api.removeChildren(el)
        }
    }
}
```
这个函数做了以下事情：

* 找到对应的真实dom，称为el
* 判断Vnode和oldVnode是否指向同一个对象，如果是，那么直接return
* 如果他们都有文本节点并且不相等，那么将el的文本节点设置为Vnode的文本节点。
* 如果oldVnode有子节点而Vnode没有，则删除el的子节点
* 如果oldVnode没有子节点而Vnode有，则将Vnode的子节点真实化之后添加到el
* 如果两者都有子节点，则执行updateChildren函数比较子节点，这一步很重要
* 其他几个点都很好理解，我们详细来讲一下updateChildren

## updateChildren
updateChildren是diff算法的精髓
```js
updateChildren (parentElm, oldCh, newCh) {
    let oldStartIdx = 0, newStartIdx = 0
    let oldEndIdx = oldCh.length - 1
    let oldStartVnode = oldCh[0]
    let oldEndVnode = oldCh[oldEndIdx]
    let newEndIdx = newCh.length - 1
    let newStartVnode = newCh[0]
    let newEndVnode = newCh[newEndIdx]
    let oldKeyToIdx
    let idxInOld
    let elmToMove
    let before
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (oldStartVnode == null) {   // 对于vnode.key的比较，会把oldVnode = null
            oldStartVnode = oldCh[++oldStartIdx] 
        }else if (oldEndVnode == null) {
            oldEndVnode = oldCh[--oldEndIdx]
        }else if (newStartVnode == null) {
            newStartVnode = newCh[++newStartIdx]
        }else if (newEndVnode == null) {
            newEndVnode = newCh[--newEndIdx]
        }else if (sameVnode(oldStartVnode, newStartVnode)) {
            patchVnode(oldStartVnode, newStartVnode)
            oldStartVnode = oldCh[++oldStartIdx]
            newStartVnode = newCh[++newStartIdx]
        }else if (sameVnode(oldEndVnode, newEndVnode)) {
            patchVnode(oldEndVnode, newEndVnode)
            oldEndVnode = oldCh[--oldEndIdx]
            newEndVnode = newCh[--newEndIdx]
        }else if (sameVnode(oldStartVnode, newEndVnode)) {
            patchVnode(oldStartVnode, newEndVnode)
            api.insertBefore(parentElm, oldStartVnode.el, api.nextSibling(oldEndVnode.el))
            oldStartVnode = oldCh[++oldStartIdx]
            newEndVnode = newCh[--newEndIdx]
        }else if (sameVnode(oldEndVnode, newStartVnode)) {
            patchVnode(oldEndVnode, newStartVnode)
            api.insertBefore(parentElm, oldEndVnode.el, oldStartVnode.el)
            oldEndVnode = oldCh[--oldEndIdx]
            newStartVnode = newCh[++newStartIdx]
        }else {
           // 使用key时的比较
            if (oldKeyToIdx === undefined) {
                oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx) // 有key生成index表
            }
            idxInOld = oldKeyToIdx[newStartVnode.key]
            if (!idxInOld) {
                api.insertBefore(parentElm, createEle(newStartVnode).el, oldStartVnode.el)
                newStartVnode = newCh[++newStartIdx]
            }
            else {
                elmToMove = oldCh[idxInOld]
                if (elmToMove.sel !== newStartVnode.sel) {
                    api.insertBefore(parentElm, createEle(newStartVnode).el, oldStartVnode.el)
                }else {
                    patchVnode(elmToMove, newStartVnode)
                    oldCh[idxInOld] = null
                    api.insertBefore(parentElm, elmToMove.el, oldStartVnode.el)
                }
                newStartVnode = newCh[++newStartIdx]
            }
        }
    }
    if (oldStartIdx > oldEndIdx) {
        before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].el
        addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx)
    }else if (newStartIdx > newEndIdx) {
        removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
    }
}
```
主要做了这5个事：
1、旧头 == 新头

2、旧尾 == 新尾

3、旧头 == 新尾

4、旧尾 == 新头

5、单个查找

举个例子来说明一下：
真实: [A, B, C, D, E]
旧：  [A, B, C, D, E]
新:   [A, F, C, G, E]

下面用下表1，代表指针在的位置
1. 
真实: [A, B, C, D, E]
旧：  [A1, B, C, D, E1]
新:   [A1, F, C, G, E1]

比较前4步，若头部指针匹配，则头部的指针往后移动；若尾部的指针匹配，则往前移动
A1 == A1，头指针往后移动，再开始新一轮的5步比较；E1==E1，尾指针往后迁，如下2：

2.
真实: [A, B, C, D, E]
旧：  [A, B1, C, D1, E]
新:   [A, F1, C, G1, E]

F1前4步都不匹配，就循环，发现没有，则新建F，插入已处理的节点后，也就是A后，并标记F`,这一步直接在dom上操作，如下3：

3.
真实: [A, F（新）, B, C, D, E]
旧：  [A, B1, C, D1, E]
新:   [A, F`, C1, G1, E]

新节点C的前4步都不匹配，则循环，在旧节点找到了C，则将C移动到已处理的节点后，即F(新)后

4. 
真实: [A, F（新）, C（移动）, B, C, D, E]
旧：  [A, B1, C, D1, E]
新:   [A, F`, C`, G11, E]

G匹配5步都没有，则新建


5. 
真实: [A, F（新）, C（移动）, G（新建）, B, C, D, E]
旧：  [A, B1, C, D1, E]
新:   [A, F`, C`, G1, E1]

G操作后，再往后移，此时，前指针移动到了后指针之后了，匹配结束，将旧节点两个之间的节点删除

6.
真实: [A, F（新）, C（移动）, G（新建）, B删, C`删, D删, E]
旧：  [A, B1, C, D1, E]
新:   [A, F`, C`, G1, E1]

=》 真实：[A, F, C, G, E]

## 重点：
diff的比较方式
进行同层比较，不会进行跨层比较，如：给一个子节点加上一个父节点，会认为父节点和以前的子节点是同层但不同，不会利用之前的子节点，而是将其删除后再创建
vue的diff并不是“无微不至”，但上面的做法并不影响效率，因为实际代码很少有上面这种操作

在采取diff算法比较新旧节点的时候，比较只会在同层级进行, 不会跨层级比较，这样将时间复杂度为 O(n3),Vue进行了优化·O(n3) *复杂度*的问题转换成 O(n) *复杂度*的问题(只比较同级不考虑跨级问题)，因为你很少会跨越层级地移动Dom元素。 所以 Virtual Dom只会对同一个层级的元素进行对比