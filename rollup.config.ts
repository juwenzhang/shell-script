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
import { fileURLToPath } from 'url'

const FILE_NAMES = [
    'LICENSE',
    'README.md',
    'README.zh-cn.md',
    'package.json',
]
const PRIVILEGE = {
    ROOT: 0,
    TEMP: 1,
}
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
const CMD: string[] = []
const BASIC: {
    key: string
    value: string
}[] = []
const FORMAT = {
    PKGS: '使用了的依赖有：',
    CMD: 'npm|pnpm|yarn run <script>',
    NORMAL: '<key>是<value>',
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

/**
 * 检查文件是否存在并且返回文件路径，优先使用 temp 目录
 * @returns 文件路径数组
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
        !README.includes('<!-- BASIC -->')) {
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
    }
    const FORMAT_PKGS = PKGS.length ? FORMAT.PKGS + '\n' + PKGS.map((pkg) => {
        return `* ${pkg}`
    }).join('\n') : '没有使用到的依赖'
    console.log(FORMAT_PKGS)

    const FORMAT_CMD = "可以使用的脚本命令有:" + "\n" + CMD.map(cmd => {
        const _cmd = FORMAT.CMD
        return '* ' + _cmd.replace('<script>', cmd)
    }).join('\n')

    const normal = FORMAT.NORMAL
    const FORMAT_BASIC = '基本信息:\n' + BASIC.map(basic => {
        return '* ' + normal.replace('<key>', basic.key).replace('<value>', basic.value)
    }).join('\n')

    const README_FORMAT = README.replace('<!-- PKGS -->', '\n' + FORMAT_PKGS)
                                .replace('<!-- CMD -->', FORMAT_CMD)
                                .replace('<!-- BASIC -->', FORMAT_BASIC)
    fs.writeFileSync(path.join(DIST_DIR, 'README.md'), README_FORMAT)
    console.log('README.md 格式化完成')
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

// console.log(buildOutputConfig())

export default {
    input: 'src/main.ts',
    // dts: true,
    output: buildOutputConfig(),
    plugins: [
        json(),
        typescript({
            tsconfig: './tsconfig.json',
        }),
        license({
            banner: {
                content: {
                    file: './temp/LICENSE',
                },
            },
        }),
    ],
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
        console.log('所有操作完成')
    } catch (err) {
        console.error('执行过程中出错:', err)
    }
}

main()
