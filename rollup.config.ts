// @ts-ignore
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import license from 'rollup-plugin-license'
// @ts-ignore
import fs from 'fs'
// @ts-ignore
import path from 'path'
// @ts-ignore
import {fileURLToPath} from 'url'
// @ts-ignore
import process from 'process'
// @ts-ignore
import {execSync} from 'child_process'

// 需要copy的文件名
const FILE_NAMES = [
    'LICENSE',
    'README.md',
    'README.zh-cn.md',
    'package.json',
]
// 权限优先级
const PRIVILEGE = {
    ROOT: 0,
    TEMP: 1,
}
// package.json 中需要保留的字段
const PACKAGE_VOLUME = [
    'name',
    'version',
    'description',
    'keywords',
    'author',
    'license',
    'repository',
    'bugs',
    'homepage',
]
const DIRNAME = path.dirname(fileURLToPath(import.meta.url))
const TEMP_DIR = path.join(DIRNAME, 'temp')
const DIST_DIR = path.join(DIRNAME, 'dist')
const PKGS: string[] = []
const DEV_PKGS: string[] = []
const CMD: string[] = []
const BASIC: {
    key: string
    value: string
}[] = []
const FORMAT = {
    PKGS: '## 使用了的依赖有：',
    DEV_PKGS: '## 使用了的开发依赖有：',
    CMD: 'npm|pnpm|yarn run <script>',
    NORMAL: '<key>: <value>',
}
const PACKAGE_PATH = path.join(DIRNAME, 'package.json')
// rollup 的输出格式
const OUTPUT_FORMAT = [
    'umd',
    'iife',
    'esm',
    'cjs',
    'umd-min',
    'iife-min',
    'esm-min',
    'cjs-min',
]
const OUTPUT_FILE_NAME: Record<string, string> = {
    umd: 'bundle-umd.js',
    iife: 'bundle-iife.js',
    esm: 'bundle-esm.js',
    cjs: 'bundle-cjs.js',
    'umd-min': 'bundle-umd.min.js',
    'iife-min': 'bundle-iife.min.js',
    'esm-min': 'bundle-esm.min.js',
    'cjs-min': 'bundle-cjs.min.js',
}
let RETRY_COUNT = 5

/**
 * 检查文件是否存在并且返回文件路径，优先使用 temp 目录
 * 文件路径数组
 */
function fileExist() {
    const FILE_STAT_MAPPER = FILE_NAMES.map((file_name) => {
        // 在循环内部定义变量，避免作用域问题
        const FILE_STAT = {
            root: {
                fileName: file_name,
                path: path.join(DIRNAME, file_name),
                privilege: PRIVILEGE.ROOT,
            },
            temp: {
                fileName: file_name,
                path: path.join(TEMP_DIR, file_name),
                privilege: PRIVILEGE.TEMP,
            },
        }
        if (fs.existsSync(FILE_STAT.temp.path)) {
            return FILE_STAT.temp
        }
        if (fs.existsSync(FILE_STAT.root.path)) {
            return FILE_STAT.root
        }
        return null;
    })
    return FILE_STAT_MAPPER.filter((file_stat) => file_stat !== null)
}
/**
 * 复制文件到打包目录
 */
function copyFileSync() {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR)
    }
    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR)
    }
    const FILE_STAT_MAPPER = fileExist()
    FILE_STAT_MAPPER.forEach((file_stat) => {
        try {
            // 使用同步方式读取文件
            const data = fs.readFileSync(file_stat.path)
            // 使用同步方式写入文件
            fs.writeFileSync(path.join(DIST_DIR, file_stat.fileName), data)
            console.log(`文件 ${file_stat.fileName} 复制成功`)
        } catch (err) {
            console.error(`文件 ${file_stat.fileName} 复制失败:`, err)
        }
    })
}

/**
 * 收集基本信息
 */
function collectBasic() {
    const PACKAGE = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf-8'))
    PACKAGE_VOLUME.forEach((key) => {
        if (PACKAGE[key]) {
            BASIC.push({
                key,
                value: PACKAGE[key],
            })
        }
    })
}
/**
 * 收集需要打包的依赖
 */
function collectPKGS() {
    const PACKAGE = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf-8'))
    const DEPENDENCIES = PACKAGE.dependencies
    for (const key in DEPENDENCIES) {
        PKGS.push(key)
    }
}
/**
 * 收集开发依赖
 */
function collectDEV_PKGS() {
    const PACKAGE = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf-8'))
    const DEV_DEPENDENCIES = PACKAGE.devDependencies
    for (const key in DEV_DEPENDENCIES) {
        DEV_PKGS.push(key)
    }
}
/**
 * 收集可使用脚本命令
 */
function collectCMD() {
    const PACKAGE = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf-8'))
    const SCRIPTS = PACKAGE.scripts
    for (const key in SCRIPTS) {
        CMD.push(key)
    }
}
/**
 * 获取所有的信息
 */
function getAllInfo() {
    collectBasic()
    collectPKGS()
    collectDEV_PKGS()
    collectCMD()
}
/**
 * 格式化信息并且更新 README.md
 */
function formatREADME() {
    getAllInfo()
    // 从原始开发目录读取 README 文件，而不是从 dist 目录
    let README = fs.readFileSync(path.join(DIRNAME, 'README.md'), 'utf-8')
    // 检查 README 中是否具备需要的 注释
    if (!README.includes('<!-- PKGS -->') ||
        !README.includes('<!-- CMD -->') ||
        !README.includes('<!-- BASIC -->') ||
        !README.includes('<!-- DEV_PKGS -->')) {
        // 进行在 README 中对应的 <!-- PKGS --> 方便后续的替换
        if (!README.includes('<!-- PKGS -->')) {
            README = README + '\n<!-- PKGS -->\n'
        }
        if (!README.includes('<!-- CMD -->')) {
            README = README + '\n<!-- CMD -->\n'
        }
        if (!README.includes('<!-- BASIC -->')) {
            README = README + '\n<!-- BASIC -->\n'
        }
        if (!README.includes('<!-- DEV_PKGS -->')) {
            README = README + '\n<!-- DEV_PKGS -->\n'
        }
    }
    const FORMAT_PKGS = PKGS.length ? FORMAT.PKGS + '\n' + PKGS.map((pkg) => {
        return `* ${pkg}`
    }).join('\n') : '## 没有使用任何依赖'

    const FORMAT_DEV_PKGS = DEV_PKGS.length ? FORMAT.DEV_PKGS + '\n' + DEV_PKGS.map((pkg) => {
        return `* ${pkg}`
    }).join('\n') : '## 没有使用任何开发依赖'

    const FORMAT_CMD = "## 可以使用的脚本命令有:" + "\n" + CMD.map(cmd => {
        const _cmd = FORMAT.CMD
        return '* ' + _cmd.replace('<script>', cmd)
    }).join('\n')

    const normal = FORMAT.NORMAL
    const FORMAT_BASIC = '## 基本信息:\n' + BASIC.map(basic => {
        let content = basic.value;  
        if (Array.isArray(content)) {
            content = content.length ? content.join(', ') : '...'
        }
        return '* ' + normal.replace('<key>', basic.key).replace('<value>', content)
    }).join('\n')

    const README_FORMAT = README.replace('<!-- PKGS -->', '\n' + FORMAT_PKGS)
                                .replace('<!-- DEV_PKGS -->', FORMAT_DEV_PKGS)
                                .replace('<!-- CMD -->', FORMAT_CMD)
                                .replace('<!-- BASIC -->', FORMAT_BASIC)
    fs.writeFileSync(path.join(DIST_DIR, 'README.md'), README_FORMAT)
    console.log('README.md 格式化完成')
}

function getExecResult(cmd: string) {
    try {
        const result = execSync(cmd).toString().trim()
        return result
    } catch (err) {
        console.error(`执行命令 ${cmd} 失败:`, err)
        return ''
    }
}

function getGetConfigFromLocal() {
    try {
        // 首先尝试获取本地配置
        const GIT_CONFIG = getExecResult('git config --local --get user.name')
        if (GIT_CONFIG) {
            return GIT_CONFIG
        }
        const GLOBAL_CONFIG = getExecResult('git config --global --get user.name')
        if (GLOBAL_CONFIG) {
            console.log('本地git配置未设置，使用全局配置:')
            return GLOBAL_CONFIG
        }
        console.warn('获取git配置失败（本地和全局都未设置）')
        console.warn('提示：可以使用以下命令设置git配置：git config --global user.name "Your Name"')
        return ''
    } catch (err) {
        console.error('获取git配置时出现异常:', err)
        return ''
    }
}
/**
 * 格式化 LICENSE，即使git配置获取失败也能返回默认内容
 */
function formatLicense(): string {
    try {
        let authorName = 'Anonymous'; // 默认作者名
        try {
            const GIT_CONFIG = getExecResult('git config --local --get user.name') 
                || getExecResult('git config --global --get user.name');
            if (GIT_CONFIG) {
                authorName = GIT_CONFIG;
                console.log('使用git配置的作者名:', authorName)
            } else {
                console.warn('未找到git配置，使用默认作者名')
            }
        } catch (gitErr) {
            console.warn('获取git配置时出错，使用默认作者名:', gitErr.message)
        }
        const LICENSE = fs.readFileSync(path.join(TEMP_DIR, 'LICENSE'), 'utf-8')
        const LICENSE_FORMAT = LICENSE.replace('<!-- year -->', new Date().getFullYear().toString())
                                      .replace('<!-- author -->', authorName)
        
        fs.writeFileSync(path.join(DIST_DIR, 'LICENSE'), LICENSE_FORMAT)
        return LICENSE_FORMAT;  // 返回格式化后的LICENSE
    } catch (err) {
        console.error('格式化LICENSE时出错:', err)
        const defaultLicense = `MIT License

Copyright (c) ${new Date().getFullYear()} Anonymous

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
        try {
            fs.writeFileSync(path.join(DIST_DIR, 'LICENSE'), defaultLicense)
        } catch (writeErr) {
            console.error('写入默认LICENSE失败:', writeErr)
        }
        
        return defaultLicense;
    }
}

/**
 * 格式化 rollup 配置
 */
function getMinifyPlugin() {
    return {
        // minify: true,
        plugins: [
            terser()
        ],
    }
}
function getNormalConfig() {
    return {
        name: 'ShellScript',
    }
}
function buildOutputConfig() {
    const normal_config = getNormalConfig()
    const minify_config = getMinifyPlugin()
    const OUTPUT_DIR = 'dist'
    const output_config = OUTPUT_FORMAT.map(format => {
        const file_name = path.join(OUTPUT_DIR, OUTPUT_FILE_NAME[format])
        if (!format.includes('min')) {
            return {
                ...normal_config,
                format,
                file: file_name,
            }
        } else {
            return {
                ...normal_config,
                ...minify_config,
                format: format.replace('-min', ''),
                file: file_name,
            }
        }
    })
    return output_config;
}

// 延迟加载license内容，避免在配置阶段执行git命令
function createLicensePlugin() {
    return license({
        banner: {
            content: '', // 空内容，后续在main函数中处理
        },
    });
}

// 修改getPluginConfigs，使用延迟加载的license插件
function getPluginConfigs() {
    return [
        json(),
        typescript({
            tsconfig: "./tsconfig.json",
        }),
        createLicensePlugin(),
    ]
}

export default {
    input: 'src/main.ts',
    // 推荐替代工具，使用 tsup 默认支持 dts 生成的呐
    // dts: true,  // rollup 默认是不支持的呢，此时需要安装插件 rollup-plugin-dts
    output: buildOutputConfig(), 
    plugins: getPluginConfigs(), 
};

/**
 * 主函数，确保复制文件完成后再格式化 README
 */
function main() {
    try {
        // 先复制文件
        copyFileSync()
        // 再格式化 README
        formatREADME()
        // 尝试格式化 LICENSE，但即使失败也继续执行
        try {
            const formattedLicense = formatLicense();
            if (formattedLicense) {
                console.log('LICENSE 格式化完成')
            }
        } catch (licenseErr) {
            console.warn('LICENSE 格式化失败，使用默认内容:', licenseErr.message)
        }
        console.log('所有必要操作完成')
    } catch (err) {
        if (RETRY_COUNT-- > 0) {
            console.log(`重试中... (剩余次数: ${RETRY_COUNT})`)
            main()
        } else {
            console.error('执行过程中出错:', err)
            process.exit(1)
        }
    }
}

main()
