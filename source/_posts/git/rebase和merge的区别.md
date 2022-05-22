---
title: git rebase和git merge的区别
date: 2020-01-28 16:03:55
tags: git
categories: git
---
假设有个开发过程如下：
```html
1. master分支有两个commit：C1 -> C2
2. 我基于master切一个dev分支进行开发
3. dev分支在今天下午生成了3个commit，分别在：C3(2点)-> C4(3点) -> C5(6点)
4. 同样在今天下午，其它开发者先于我在master分支上合入了自己的分支，C6(4点) -> C7(5点)，所以远程的master就变成了C1 -> C2 -> C6(4点) -> C7(5点)
```
如下图：
![](./a1.jpg)
```
5. 在7点，我想把我的dev分支合进master，有两种选择：merge和rebase
```

### 使用git merge
```
1. 在master上，执行`git merge dev`
2. git会找出master和dev的最近共同祖先commit点，即分叉点C2
3. 然后进行合并，将dev最后1次的commit（C5）和master最后一次commit（C7）合并后生成一个新的commit（C8），有冲突的话需要解决冲突
4. 再将C8和C2之间的所有commit，按提交时间顺序进行排序
5. 最后生成的master：C1 -> C2 ->C3(2点)-> C4(3点) -> C6(4点) -> C7(5点) -> C5(6点) -C8(7点)
```
![](./a2.jpg)

### 使用git rebase
```
1. 在dev分支上，执行`git rebase origin/master`，push到dev远程后，再去master分支，执行`git merge dev`
2. 执行rebase时，git会找出master和dev的最近共同祖先commit点，即分叉点C2
3. 然后将dev分支上，C2到最后一次commit(C5)之间的所有commit截取，移接到master的最后一次commit(C7)后面，但截取的这一段(C3~C5的commit的hash值会变成新的，也就是变成了C3'~C5')
4. dev rebase了 master后，就变成了C1 -> C2 -> C6 -> C7 -> C3' -> C4' -> C5'
```
![](./a3.jpg)

### merge和rebase的区别
![](./a4.jpg)
* `git merge` 操作合并分支会让两个分支的每一次提交都按照提交时间（并不是push时间）排序，并且会将两个分支的最新一次commit点进行合并成一个新的commit，最终的分支树呈现菱形

* `git rebase`操作实际上是将当前执行rebase分支的所有基于原分支提交点之后的commit打散成一个一个的patch，并重新生成一个新的commit hash值，再次基于原分支目前最新的commit点上进行提交，并不根据两个分支上实际的每次提交的时间点排序，rebase完成后，切到基分支进行合并另一个分支时也不会生成一个新的commit点，最终的分支树呈现线性


