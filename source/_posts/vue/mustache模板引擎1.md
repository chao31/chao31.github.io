---
title: mustache模板引擎（一）
date: 2020-10-24 08:19:27
tags: vue
categories: vue
---
## 什么是模板引擎
数据变成视图的最优雅的解决方案,vue的模板引擎也借鉴于此

## 历史上曾经出现的数据变为视图的方法
1. 纯DOM法：非常笨拙，没有实战价值

2. 数组join法: 曾几何时非常流行，是曾经的前端必会知识
```js
for (var i=0,len = arr.length;i<len;++i){
  list.innerHTML += [
    '<li>',
    '  <div class="hd">' +arr[i].name + '的基本信息</div>',
    '  <div class="bd">',
    '    <p>姓名：'+arr[i].name+'</p>',
    '    <p>年龄：'+arr[i].age+'</p>',
    '    <p>性别：'+arr[i].sex+'</p>',
    '  </div>',
    '</li>'
  ].join('')
}
```

3. ES6的反引号法：ES6中新增的${a}语法糖，很好用
```js
for (var i=0,len = arr.length;i<len;++i){
  list.innerHTML += `
    <li> 
      <div class="hd">${arr[i].name}的基本信息</div>  
      <div class="bd">    
        <p>姓名：${arr[i].name}</p>    
        <p>年龄：${arr[i].age}</p>    
        <p>性别：${arr[i].sex}</p>  
      </div>
    </li>
  `
}
```

4. 模板引擎：解决数据变为视图的最优雅的方法

## 使用主要方法
1.循环
View:
```js
{
  "stooges": [
    { "name": "Moe" },
    { "name": "Larry" },
    { "name": "Curly" }
  ]
}
```


Template:
```html
{{#stooges}}
<b>{{name}}</b>
{{/stooges}}
```

Output:
```html
<b>Moe</b>
<b>Larry</b>
<b>Curly</b>
```

2. `.`简化数组循环
View:
```js
{
  "musketeers": ["Athos", "Aramis", "Porthos", "D'Artagnan"]
}
```

Template:
```html
{{#musketeers}}
* {{.}}
{{/musketeers}}
```

Output:
```
* Athos
* Aramis
* Porthos
* D'Artagnan
```

## 实现需求 
实现一个建议的for循环模板，并支持`.`循环符
> 实现需求，将下列模板，关联data后，渲染成dom
模板:
```js
var templateStr = `
  <ol>
    {{#students}}
    <li> 
      学生{{name}} 好朋友是{{friend.name}}  自己的爱好是
      <ol>
        {{#hobbies}}
        <li>{{.}}</li>
        {{/hobbies}}
      </ol>
    </li>
    {{/students}}
  </ol>
`
数据：
```js
var data = {
  students: [
    {name: "小明", hobbies: ['编程', '打游戏'], friend: {name: '小七'}},
    {name: "小红", hobbies: ['追剧'], friend: {name: '小紫'}}
  ]
}
```

## 源码实现
看下一篇
