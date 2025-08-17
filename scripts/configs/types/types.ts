interface config {
    cmd_name: string
    cmd_desc: string
    cmd_path: string
    cmd_args: string[]
    cmd_alias: string[]
    cmd_env: string[]
    cmd_help: string
    cmd_example: string
    cmd_other: string[]
}

type CONFIG_COLLECTION = config[]
export default CONFIG_COLLECTION