---
title: mustache模板引擎（二）
date: 2020-10-26 09:29:37
tags: vue
categories: vue
---
## 扫描器
扫描器，主要作用是扫描到`{{`之前的数据，`}}`之后的数据，以及它们之间的数据，保存到token里，便于以后拼装
```js
// 扫描器
class Scanner {
 
  constructor(templateStr){
    this.pos = 0;
    this.tail = templateStr;
    this.templateStr = templateStr;
  }
  // 扫描到'{{'后，重新赋值pos和tail
  // pos和tail都从'{{'后重新开始
  scan(stopTag) {
    if (this.tail.indexOf(stopTag) === 0) {
      this.pos += stopTag.length;
      this.tail = this.templateStr.substring(this.pos);
    }
  } 
  
  // 返回'{{'之前的值
  scanUtil(stopTag) {
    const pos_backup = this.pos; 
    // 当尾巴的开头不是stopTag 的时候，就说明还没有扫描到stopTag
    while(this.tail.indexOf(stopTag) !==0 && !this.eos()){
      this.pos++;
      // 改变尾巴从当前指针的这个字符开始到最后
      this.tail = this.templateStr.substr(this.pos);
    }
    return this.templateStr.substring(pos_backup, this.pos);
  }

  // 判断指针是否走到了头
  eos(){
    return this.pos >= this.templateStr.length;
  }
}
```
## 将模板转换成token
什么是tokens，也就是将模板转换成如下数组结构：
```js
`
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
```
![](./1.jpg)
```js
// 将模板转换成tokens
function parseTemplateToTokens(templateStr) {
  let tokens = [];
  let scanner = new Scanner(templateStr)
  let words;
  while(!scanner.eos()){
    words = scanner.scanUtil('{{')
    if (words !== '' ){
      tokens.push(['text',words.replace(/\s+/g,' ')]) // 将多个空格合并成一个
    }
    scanner.scan('{{')
    words = scanner.scanUtil('}}')
    if (words!==''){
      if (words[0]==='#'){
        tokens.push(['#', words.substring(1)]);
      } else if (words[0] === '/') {
        tokens.push(['/', words.substring(1)]);
      } else {
        tokens.push(['name', words])
      }
    }
    scanner.scan('}}')
  }
  return nestTokens(tokens)
}
```
## 将tokens折叠
`#`和`/`之间的token，是一个循环，应该属于上一个token的子项，折叠后的token结构如下：
![](./2.png)
```js
// 将#开头的token，折叠进多维数组
function nestTokens(tokens) {
  let nestedTokens = []; // 结果数组
  let sections = []; // 一个栈结构
  let collector = nestedTokens; // 收集器
  for (let i=0,len = tokens.length ;i<len ;++i) {
    let token = tokens[i];
    switch (token[0]) {
      case '#':
        collector.push(token);
        sections.push(token);
        collector = token[2] = []; // 给token 添加下标为2的项 并且让收集器指向它
        break
      case '/':
        sections.pop();
        collector = sections.length >0 ? sections[sections.length - 1][2]:nestedTokens;
        break
      default:
        collector.push(token);
    }
  }
  return nestedTokens
}
```

## 将tokens渲染成dom
思路是将token里面的字符串连接起来，`双{}`之间的东西，要用data替换
```js
function renderTemplate (tokens, data) {
  let resultStr = ''
  for (let i=0,len = tokens.length ; i<len ; ++i ){
    let token = tokens[i]
    if (token[0] === 'text') {
      resultStr += token[1]
    } else if (token[0] === 'name') {
      resultStr += lookup (data, token[1])
    } else if (token[0] === '#') {
      resultStr += parseArray(token, data)
    }
  }
  return resultStr
} 
```

## 处理a.b.c
因为`a[b.c]`是不能取到`a.b.c`的，数据的，所以要对级联`.`取值，做处理：
```js
function lookup (dataObj, keyName) {
  // 判断的时候不能是. 本身
  if (keyName.indexOf('.') !== -1 && keyName !== '.')  {
    let keys = keyName.split('.')
    let temp = dataObj
    for (let i=0, len = keys.length; i<len ; ++i) {
      temp = temp[keys[i]]
    }
    return temp
  }
  return dataObj[keyName] // 没有'.'
} 
```

## 处理建议循环符`.`
对于`.`代表，循环数组中的每一项，当访问父元素的点属性时，可以将数据本身复制给点
```js
function parseArray(token, data) {
  let v = lookup(data, token[1]);
  let resultStr = ''
  for (let i=0, len = v.length ;i<len ;++i) {
    resultStr += renderTemplate(token[2], {
      ...v[i],
      '.': v[i]
    })
  }
  return resultStr
}
```

## render函数调用主流程
```js
function render (templateStr, data) {
  let tokens = parseTemplateToTokens(templateStr)
  console.log(tokens)
  let result = renderTemplate(tokens,data)
  console.log (result)
  return result
}
```

## 调用
```html
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>mustache</title>
</head>
<body>
  <div id ="container">
  </div>
  <script src="b.js"></script>
  <script>
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
    var data = {
      students: [
        {name: "小明", hobbies: ['编程', '打游戏'], friend: {name: '小七'}},
        {name: "小红", hobbies: ['追剧'], friend: {name: '小紫'}}
      ]
    }
   document.getElementById("container").innerHTML = render(templateStr,data)
  </script>
</body>
</html>
```
![](./03.jpg)