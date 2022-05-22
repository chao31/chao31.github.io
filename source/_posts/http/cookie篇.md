---
title: cookie篇
date: 2019-11-21 21:03:50
tags: http
categories: http
---
## 什么是cookie?

1. 第一次访问服务器的时候，会在`响应头`里面看到Set-Cookie信息（只有在首次访问服务器的时候才会在`响应头`中出现该信息）,如：
Set-Cookie:JSESSIONID=joadjosd

2. 浏览器会根据响应头的set-cookie信息设置浏览器的cookie并保存到浏览器本地

3. 当再次请求的时候（非首次请求），浏览器会在请求头里将cookie发送给服务器(每次请求都是这样)，如：
将上面保存的 JSESSIONID=joadjosd 发给服务器

## 什么是JSESSIONID？

 1. 当用户访问服务器的时候，服务器会为每一个用户开启一个session,浏览器是怎么判断这个session到底是属于哪个用户呢？JSESSIONID的作用就体现出来了：JSESSIONID就是用来判断当前用户对应于哪个session，换句话说JSESSIONID会告诉服务器该浏览器的session保存在服务器内存的什么地方。

2. 服务器首先检查这个浏览器的请求里是否已包含了一个session标识————称为session id，如果已包含则说明以前已经为此浏览器创建过session，服务器就按照session id把这个session检索出来使用（检索不到，会新建一个）；如果浏览器请求不包含session id，则为此浏览器创建一个session并且生成一个与此session相关联的session id，session id的值应该是一个既不会重复，又不容易被找到规律以仿造的字符串，这个session id将被在本次响应中返回给浏览器保存。

3. 保存这个session id的方式可以采用cookie，这样浏览器在下次请求中，会把包含这个session id的cookie发送给服务器。

4. 一般这个cookie的名字都是类似于SESSIONID，JSESSIONID只是tomcat的对session id的叫法，其实就是session id，在其它的容器也许就不叫JSESSIONID了。

## 创建cookie
```js
function setCookie(name,value,cookieDomain) {
  document.cookie = name + '='+ encodeURIComponent(value) + ';domain=' + cookieDomain + ';path=/';
}
```

## 删除cookie
```js
// 删除 cookie 非常简单。您只需要设置 expires 参数为以前的时间即可
function delCookie(name) {  
  var exp = new Date();
  exp.setTime(exp.getTime() - 1);  
  var cookie = getCookie(name);  
  cookie && (document.cookie = name + '=' + cookie + ';expires=' + exp.toGMTString()); 
}
```

## cookie属性
| 属性项 |	属性项介绍 |
|---
| NAME=VALUE |	键值对，可以设置要保存的 Key/Value，注意这里的 NAME 不能和其他属性项的名字一样
| Expires | 过期时间，在设置的某个时间点后该 Cookie 就会失效
| Domain	| 生成该 Cookie 的域名，如 domain="www.baidu.com"
| Path	| 该 Cookie 是在当前的哪个路径下生成的，如 path=/wp-admin/
| Secure	| 如果设置了这个属性，那么只会在 SSH 连接时才会回传该 Cookie


## 参考：
1.[JSESSIONID的简单说明](https://blog.csdn.net/tanga842428/article/details/78600940)
2.[cookie、session、sessionid 与jsessionid](https://www.cnblogs.com/caiwenjing/p/8081391.html)
3.[深入理解Cookie](https://www.jianshu.com/p/6fc9cea6daa2)
4.[javascript cookie](https://www.runoob.com/js/js-cookies.html)