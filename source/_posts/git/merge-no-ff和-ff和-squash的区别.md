---
title: merge--no-ff和--ff和--squash的区别
date: 2020-02-01 11:52:12
tags: git
categories: git
---
### 一张图来告诉你--no-ff和--ff
![](./b6.png)

### git merge
> 我们平常什么都不加的时候，则使用默认的 --ff ， 即 fast-forward 方式

> fast-forward方式就是当条件允许的时候，git直接把HEAD指针指向合并分支的头，完成合并。属于“快进方式”，不过这种情况如果删除分支，则会丢失分支信息。因为在这个过程中没有创建commit

### git merge --no-ff
```
指的是强行关闭fast-forward方式,保留分支的commit历史
```

### git merge --squash

> 是用来把一些不必要commit进行压缩，比如说，你的feature在开发的时候写的commit很乱，那么我们合并的时候不希望把这些历史commit带过来，于是使用


### 动图来告诉几种合并的区别
![](./b1.gif)
![](./b2.gif)
![](./b3.gif)
![](./b4.gif)
![](./b5.png)

### 举个例子
![](./a1.png)
> 在master分支上，执行`git merge hotfix`
> 然后看到了Fast-forward 的字样，hotfix通过--ff的方式合进了master，如下：
![](./a2.png)
> 仅仅是master指针指向了这个提交C4。这样是一种比较快的合并方式，轻量级，简单。
> 这个时候，我们往往会删掉hotfix分支，因为它的历史作用已经结束，这个时候，我们的iss53这个功能又向前开发，进行了一次提交，到了C5，那么变成了这样：
![](./a3.png)
> 然后，我们要把iss53 这个分支合并回master，因为有分叉，两个版本的内容要进行合并,是不能用Fast-forward（只有在没有需要合并内容的时候，会有这个fast-forward 方式的提交） ，这时用的就是--no-ff的效果，并生成了一个新的commit号
![](./a4.png)
> 如果我们对第一次合并，使用了--no-ff参数，那么也会产生这样的结果，生成一个新的提交，实际上等于是对C4 进行一次复制，创建一个新的commit，这就是--no-ff的作用。

参考:
[“git merge”和”git merge–no ff”有什么区别？](https://www.codenong.com/9069061/)
[Git：git-merge的--ff和--no-ff](https://blog.csdn.net/chaiyu2002/article/details/81020370)

