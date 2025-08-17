## shell-script 脚本
* 核心使用
    * typescript
    * rollup
    * shell
* 安装依赖
    * pnpm install
* 运行脚本
    * pnpm run build

## 核心目的
* 定义一下平时常用的 shell 脚本nodejs 库，但是不依赖于 bash，而是依赖于 nodejs
    * rust - cargo 
    * nodejs - npm|pnpm|yarn
    * golang - go
    * python - uv
    * git - git

## 实现细节使用包
* child-process 用于执行一些自定义脚本命令
* fs 用于配合打包工具实现定制化的处理文件的移动
* path 用于处理文件路径
* execa 用于执行一些命令
* globby 用于 glob 匹配
* ora 用于终端输出
* shelljs 用于执行一些 shell 命令
* rollup 用于打包: cjs, esm, umd iife
* typescript 用于编译 typescript 代码
* @rollup/plugin-typescript 用于 rollup 打包 typescript 代码
* @rollup/plugin-node-resolve 用于 rollup 打包 node 模块
* @rollup/plugin-commonjs 用于 rollup 打包 commonjs 模块
* @rollup/plugin-terser 用于 rollup 打包压缩代码