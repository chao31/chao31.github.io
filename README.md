
## 开发
### 起本地服务

```bash
npm run server
```

### 打包 + 发布

```bash
npm run deploy
```

### 仅发布（ public 里的产物）

```bash
hexo deploy -d
```

### 仅构建（输出到public ）

```bash
npm run build
```

## 写作

clone 下来本项目后，删除`source/_posts`里的子文件，换成自己的 md

## 设置github page

`Settings` -> `Pages` -> `Source` -> `Branch` 选择 `gh-pages`

因为本项目的静态资源是deploy在`gh-pages`分支上的，所以 `github page` 的静态资源也应该选择对应分支

综上：

我的`master`是用来保存代码，而`gh-pages`用来构建发布静态资源
