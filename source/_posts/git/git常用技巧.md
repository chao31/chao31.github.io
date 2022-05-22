---
title: git常用技巧
date: 2017-08-12 16:58:14
tags: git
categories: git
---
### git push --set-upstream

新建一个分支NAME后，直接执行`git push`到远程，是push不上去的

要么就是暴力推上去`git push origin NAME`,

若用下面这个建立远程关联，以后就能用`git push`了
```js
git push --set-upstream origin NAME
```
### git push 
```
// 提交本地test分支 作为 远程的master分支
git push origin test:master 
```

### git rebase

```
// 相当于是从远程获取最新版本到本地，不会自动merge
git fetch

// 把b分支合并到当前分支
git rebase b 

// 如：将远程的origin/master，合到本地分支
git rebase origin/master


```

### 提mr时，合master有冲突
```js
git checkout -b <分支名> origin/<分支名>
git checkout master
git pull --rebase=true

git checkout <分支名>
# 合并master
git merge master --no-ff
# 解决冲突后，
git add -A
git commit -m <合并信息>
git push origin <分支名>:<分支名>
```

### 文件回退到指定版本
```js
// 会把文件变成绿色 + 红色
git reset xxxx file
// 对红色进行checkout恢复，就只剩绿色了，但文件已经变回指定版本了
git checkout file
// 若想让绿色变成红色，继续reset操作
```

### 回退到某个版本
[详细请看](https://chao31.github.io/2018/06/13/git/git%E7%9A%84reset%E5%8C%BA%E5%88%AB/)
```js
git reset abcsd
git reset --hard abcsd
git reset --soft abcsd
```

### git reflog 回退到某个操作
```js
// 通过reflog找到操作的commit
git reflog
// 回到那个commit
git reset 
```

### 回退到上一个版本
上一个版本就是`HEAD^`，上上一个版本就是`HEAD^^`，当然往上100个版本写`100个^`比较容易数不过来，所以写成`HEAD~100`
```js
git reset --hard HEAD^
```

### git diff
```js
// 查看当前修改了啥
git diff
// 和某个commit做diff
git diff 276bb8f
// 和某个文件做diff
git diff index.html
```
### 查看分支合并图
```js
git log --graph
```

### 基于某个分支创建新分支
```js
// 基于当前分支创建新分支dev
git checkout -b dev

// 基于远程分支，创建新分支
git checkout -b <分支名> origin/<分支名>

// 如：本地没有 develop-test，基于远程创建一个develop-test
git checkout -b develop-test origin/develop-test
```

### 分支
查看本地分支：`git branch`

查看远程分支：`git branch -a`

创建分支：`git branch <name>`

切换分支：`git checkout <name>`

创建+切换分支：`git checkout -b <name>`

合并某分支到当前分支：`git merge <name>`

删除分支：`git branch -d <name>`

### git stash
查看工作现场：`git stash list`

恢复现场但不删除stash：`git stash apply`

删除stash：`git stash drop`

恢复现场并删除stash：`git stash pop`
