// 所有的命令使用该配置进行收集即可
const GLOBAL_CONFIG = {};
// 实现的是从总配置中获取得到 nodejs 全局配置
const NODEJS_GLOBAL_CONFIGS: string[] = []
// 实现的是从总配置中获取得到 rust 全局配置
const RUST_GLOBAL_CONFIGS: string[] = []
// 实现的是从总配置中获取得到 go 全局配置
const GO_GLOBAL_CONFIGS: string[] = []
// 实现的是从总配置中获取得到 git 全局配置
const GIT_GLOBAL_CONFIGS: string[] = []

export {
    GLOBAL_CONFIG,
    NODEJS_GLOBAL_CONFIGS,
    RUST_GLOBAL_CONFIGS,
    GO_GLOBAL_CONFIGS,
    GIT_GLOBAL_CONFIGS
}
