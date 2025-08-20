## shell-script script
* Core usage
    * typescript
    * rollup
    * shell
* Installation dependencies
    * pnpm install
* Run the script
    * pnpm run build

## Core Purpose
* Define the commonly used shell script nodejs library, but does not depend on bash, but on nodejs
    * rust - cargo
    * nodejs - npm|pnpm|yarn
    * golang - go
    * python - uv
    * git - git

## Implementation details usage package
* child-process is used to execute some custom script commands
* fs is used to implement customized processing files with packaging tools
* path is used to process file paths
* execa is used to execute some commands
* globby is used for glob matching
* ora for terminal output
* shelljs is used to execute some shell commands
* rollup for packaging: cjs, esm, umd iife
* typescript is used to compile typescript code
* @rollup/plugin-typescript for rollup packaging typescript code
* @rollup/plugin-node-resolve for rollup packaging node modules
* @rollup/plugin-commonjs is used to rollup to package commonjs modules
* @rollup/plugin-terser for rollup packaging compressed code

## The dependencies used are:
* @vitalets/google-translate-api
* chalk

## The script commands that can be used are:
* npm|pnpm|yarn run build
* npm|pnpm|yarn run watch
* npm|pnpm|yarn run start:cjs
* npm|pnpm|yarn run start:esm
* npm|pnpm|yarn run start
* npm|pnpm|yarn run test

## Basic information:
* name: shell-script
* version: 1.0.0
* keywords: ...
* author: juwenzhang
* license: MIT

## The development dependencies used are:
* @rollup/plugin-json
* @rollup/plugin-terser
* @rollup/plugin-typescript
* @types/node
* rollup
* rollup-plugin-dts
* rollup-plugin-license
* ts-node
* tslib
* typescript