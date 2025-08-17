import {execSync} from 'child_process'

function runCommand(command: string) {
    try {
        const output = execSync(command, { encoding: 'utf-8' });
        console.log(output);
    } catch (error) {
        console.error(`Error running command: ${command}`);
        console.error(error);
    }
}

function getRunMode() {
    const args = process.argv.slice(2);
    const mode = args[0];
    return mode ? mode : 'cjs';  // 默认使用 cjs 模式
}

function run() {
    try {
        const mode = getRunMode();
        if (mode === 'cjs') {
            runCommand('pnpm run start:cjs')
        } else if (mode === 'esm') {
            runCommand('pnpm run start:esm')
        } else {
            console.error(`Invalid run mode: ${mode}`);
            process.exit(1);
        }
    } catch (error) {
        console.error('Error running script:');
        console.error(error);
        process.exit(1);
    }
}

run()
