---
title: git reset、--soft、--hard的区别
date: 2018-06-13 20:15:49
tags: git
categories: git
---
```js
git reset [--soft | --mixed | --hard] 
```
为了简单，不用工作区和暂存区描述，用红色文件和绿色文件描述

### git reset 
`git reset` 不加参数，默认是--mixed 

git会回到指定的commit，并将两个commit之间的所有diff保留下来（红色文件）

利用这个特性，在合master前，feature分支的commit太多，希望合成一个
```js
// 回到最初的commit
git reset xxxxx
// 重新提一个commit
git add -A
git commit -m '新功能xxx'
```
> ☑️ Squash commits when merge request is accepted.
> 其实提MR时，勾选这个，就能合并所有的commit

### git reset --hard
git 会回到指定的commit，但两个commit之间的所有diff都被删除，干干净净的回到指定commit（如果执行这个命令之前就有被修改的红色文件，执行之后也会被删除）

### git reset --soft
git会回到指定的commit，并将两个commit之间的所有diff保留下来，但不会变成红色文件，而是变成绿色文件（执行命令之前的红色文件修改，依然保留下来为红色）