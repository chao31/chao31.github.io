---
title: HTML脱离文档流的三种方法
date: 2018-10-24 08:13:07
tags: css
categories: css
---

## 什么是文档流？
将窗体自上而下分成一行一行，并在每行中按从左至右依次排放元素，称为文档流，也称为普通流。

这个应该不难理解，HTML中全部元素都是盒模型，盒模型占用一定的空间，依次排放在HTML中，形成了文档流。



## 什么是脱离文档流？
元素脱离文档流之后，将不再在文档流中占据空间，而是处于浮动状态（可以理解为漂浮在文档流的上方）。脱离文档流的元素的定位基于正常的文档流，当一个元素脱离文档流后，依然在文档流中的其他元素将忽略该元素并填补其原先的空间。



## 怎么脱离文档流？

### float

使用float可以脱离文档流。

注意！！！：使用float脱离文档流时，其他盒子会无视这个元素，但其他盒子内的文本依然会为这个元素让出位置，环绕在该元素的周围。

举个栗子：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <style>
        .first {
            width: 200px;
            height: 200px;
            border: 3px solid red;
            float: left;
        }
        .second {
            width: 200px;
            height: 100px;
            border: 3px solid blue;
        }
    </style>
</head>
 
<body>
 
<div class="first">123</div>
<div class="second">456</div>
 
</body>
</html>
```

运行效果：

![](https://chao31.github.io/pics/img/202303021635021.png)

这段代码中把红色的框设置为了左浮，所以红色的框称为了浮动状态（浮动在蓝色框的上面），而蓝色框占用了原来空色框的位置。注意到，蓝色框中的文本依然认为红色框存在，所以为红色框让出了位置。由于div是块状元素，所以456出现在下方。

### absolute
absolute称为绝对定位，其实博主觉得应该称为相对定位，因为使用absolute脱离文档流后的元素，是相对于该元素的父类（及以上，如果直系父类元素不满足条件则继续向上查询）元素进行定位的，并且这个父类元素的position必须是非static定位的（static是默认定位方式）。

举个栗子：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <style>
        .first {
            width: 200px;
            height: 200px;
            border: 3px solid red;
        }
        .second {
            width: 200px;
            height: 100px;
            border: 3px solid blue;
            position: absolute;
        }
        .third {
            width: 200px;
            height: 200px;
            border: 3px solid green;
        }
    </style>
</head>
 
<body>
 
<div class="first">123</div>
<div class="second">456</div>
<div class="third">789</div>
 
</body>
</html>
```

![](https://chao31.github.io/pics/img/202303021637717.png)

通过把蓝色的框的position设置为absolute使蓝色的框变为浮动状态，可以看到绿色的框被蓝色的框遮挡。emmm...，看起来貌似没有问题，但是还记得前面说的absolute是相对谁定位的吗？相对非static元素的父级定位的，这里蓝框的父级就是html，所以应该是相对于html定位，但是代码中没有提供相对位置，所以只能浮动在原来该元素在文档流中的位置上方。

下面加上相对位置并把html以dotted的形式显示出来：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <style>
        .first {
            width: 200px;
            height: 200px;
            border: 3px solid red;
        }
        .second {
            width: 200px;
            height: 100px;
            border: 3px solid blue;
            position: absolute;
            left: 0;
            top: 0;
        }
        .third {
            width: 200px;
            height: 200px;
            border: 3px solid green;
        }
        html {
            border: dotted;
        }
    </style>
</head>
 
<body>
 
<div class="first">123</div>
<div class="second">456</div>
<div class="third">789</div>
 
</body>
</html>
```
![](https://chao31.github.io/pics/img/202303021637487.png)

结果很明显，蓝色的框遮住了html的点，所以当父级元素的position全是static的时候，absolute是相对于html来进行定位的。

下面举个相对于父级元素定位的栗子：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <style>
        .first {
            width: 200px;
            height: 200px;
            border: 3px solid red;
            position: relative;
        }
        .second {
            width: 200px;
            height: 100px;
            border: 3px solid blue;
            position: absolute;
            left: 0;
            top: 0;
        }
        .third {
            width: 200px;
            height: 200px;
            border: 3px solid green;
        }
        html {
            border: dotted;
        }
    </style>
</head>
 
<body>
 
<div class="first">
    123
    <div class="second">
        456
    </div>
</div>
<div class="third">
    789
</div>
 
</body>
</html>
```
![](https://chao31.github.io/pics/img/202303021638347.png)

嗯，没问题，蓝色的框是相对红色的框进行定位的，具体来说是相对于border。（可以试一下改变红色框的margin和paddind看看会发生什么）。

注意：绝对定位的窗口一般都要设置相对距离，当你同时设置top和bottom的时候，只有top会生效，同理，同时设置left和right的时候，只有left会生效。


### fixed
完全脱离文档流，相对于浏览器窗口进行定位。（相对于浏览器窗口就是相对于html）。

 举个栗子：

 ```html
 <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <style>
        .first {
            width: 200px;
            height: 200px;
            border: 3px solid red;
        }
        .second {
            width: 200px;
            height: 100px;
            border: 3px solid blue;
            position: fixed;
            right: 0;
            top: 0;
        }
        .third {
            width: 200px;
            height: 200px;
            border: 3px solid green;
        }
        html {
            border: dotted;
        }
    </style>
</head>
 
<body>
 
<div class="first">123</div>
<div class="second">456</div>
<div class="third">789</div>
 
</body>
</html>
```

![](https://chao31.github.io/pics/img/202303021638883.png)

可以很明显的看出，蓝色的框是相对于html进行定位的。当然，如果不提供相对位置的话，蓝色的框会浮动在其原先在文档流中的位置上方。

Note：文档流是在body中的，body在html中，这个在代码结构中也体现出来了，下面的例子可以更直观的看出：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <style>
        .first {
            width: 200px;
            height: 200px;
            border: 3px solid red;
        }
        .second {
            width: 200px;
            height: 100px;
            border: 3px solid blue;
        }
        .third {
            width: 200px;
            height: 200px;
            border: 3px solid green;
        }
        body {
            border: dotted red;
        }
        html {
            border: double black;
        }
    </style>
</head>
 
<body>
 
<div class="first">123</div>
<div class="second">456</div>
<div class="third">789</div>
 
</body>
</html>
```

![](https://chao31.github.io/pics/img/202303021639461.png)

### relative

最后说一个半脱离文档流的方法，就是position：relative。下面说明一下为什么是半脱离文档流。

先看下面这段代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <style>
        .first {
            width: 200px;
            height: 200px;
            border: 3px solid red;
        }
        .second {
            width: 200px;
            height: 100px;
            border: 3px solid blue;
            position: relative;
            top: 100px;
        }
        .third {
            width: 200px;
            height: 200px;
            border: 3px solid green;
        }
    </style>
</head>
 
<body>
 
<div class="first">123</div>
<div class="second">456</div>
<div class="third">789</div>
 
</body>
</html>
```

![](https://chao31.github.io/pics/img/202303021639292.png)

可以看到，蓝色的框是浮动了，但是绿色的框却相对于蓝色的框原先在文档流中的位置进行了定位。这就是所谓的半脱离文档流，本体还在文档流中占有位置，但是却可以通过改变位置使其漂浮到其他的地方，其定位方式是相对其原先在文档流中的位置进行定位的。

注意：可以尝试改变蓝色框的margin和padding属性，看一下会发生什么。

关键就是知道蓝色框在原来的文档流占用位置，相对定位后还是在原来的位置占据文档流。（类似实体投影到另一个地方）。

以上就是脱离文档流的方法。

最后再多说一句，一般设置relative是为了让absolute有个相对定位的参照。

[转载自](https://blog.csdn.net/thelostlamb/article/details/79581984)

