---
title: 如何搭建git服务器
date: 2017-09-13 14:09:58
tags: git
categories: git
---
## ubuntu安装git
```js
// 安装
sudo apt-get install git

// git仓库配置
git config --global user.name "Your Name"
git config --global user.email "email@example.com"
```
## 在Ubuntu上创建git用户
```js
sudo adduser git
```
这样在/home目录下就多了一个git目录
## 在git用户下创建.ssh 目录
```js
cd /home/git
mkdir .ssh
cd .ssh
vi authorized_keys
```
将本地~/.ssh 里的id_rsa.pub中的内容添加到服务器端的authorized_keys
![](https://upload-images.jianshu.io/upload_images/3770183-1e0b47505c13aea1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 初始化一个git仓库
在opt下建一个git目录，以后git的仓库都放在这个目录
```js
cd /opt
mkdir git
chown -R git:git git  //修改git目录的拥有者
chmod 777 git
cd git
```
> // chown将指定文件的拥有者改为指定的用户或组
chown -R 用户名:组名 文件

初始化一个project仓库，一般以.git结尾进行命名
```js
mkdir project.git 
cd project.git
git --bare init
```
## 本地进行代码推送
```js
# 在 本地 的电脑上
cd myproject
git init
git add .
git commit -m 'initial commit'
git remote add origin git@gitserver:/opt/git/project.git
git push origin master
```
若因权限问题推送失败，则可能是文件夹所有者问题
```js
# 修改服务器project.git仓库的所有者
chown -R git:git project.git
```
## node 安装
1. 去node官网，找到对应版本链接
2. `wget https://nodejs.org/dist/v10.15.0/node-v10.15.0-linux-x64.tar.xz`
3. mv到对应目录，如/opt/
4. 解压
```js
 tar -xvf   node-v10.15.0-linux-x64.tar.xz
 mv node-v10.15.0-linux-x64.tar.xz nodejs 
```
5. 确认一下nodejs下bin目录是否有node 和npm文件，如果有则执行软连接，变为全局
```js
ln -s /opt/nodejs/bin/npm /usr/local/bin/ 
ln -s /opt/nodejs/bin/node /usr/local/bin/
```




