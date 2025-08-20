import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const LoggerCollect: string[] = []
const DOCS_DIR = path.join(__dirname, '../../docs')
export let WRITE_LOG_COUNT = 0

export const LoggerLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    SUCCESS: 4
} as const

export const LoggerLevelNames = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    SUCCESS: 'SUCCESS'
} as const

export type LoggerLevelType = (typeof LoggerLevel)[keyof typeof LoggerLevel]

const levelNames: Record<LoggerLevelType, string> = {
    [LoggerLevel.DEBUG]: LoggerLevelNames.DEBUG,
    [LoggerLevel.INFO]: LoggerLevelNames.INFO,
    [LoggerLevel.WARN]: LoggerLevelNames.WARN,
    [LoggerLevel.ERROR]: LoggerLevelNames.ERROR,
    [LoggerLevel.SUCCESS]: LoggerLevelNames.SUCCESS
}

const loggerColorMap: Record<LoggerLevelType, string> = {
    [LoggerLevel.DEBUG]: 'color: blue',
    [LoggerLevel.INFO]: 'color: green',
    [LoggerLevel.WARN]: 'color: yellow',
    [LoggerLevel.ERROR]: 'color: red',
    [LoggerLevel.SUCCESS]: 'color: green'
}

export interface LoggerOptions {
    level?: LoggerLevelType;  // 日志级别
    moduleName?: string;  // 模块名称
    showTimestamp?: boolean;  // 是否显示时间戳
}

export class Logger {
    private level: LoggerLevelType;
    private moduleName?: string;
    private showTimestamp: boolean;

    constructor(options: LoggerOptions = {}) {
        this.level = options.level || LoggerLevel.INFO;
        this.moduleName = options.moduleName;
        this.showTimestamp = options.showTimestamp !== false; 
    }
    private formatMessage(level: LoggerLevelType, message: string): [string, string] {
        let formattedMessage = '';
        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').slice(0, 23);
        if (this.showTimestamp) {
            formattedMessage += `[${timestamp}] `;
        }
        if (this.moduleName) {
            formattedMessage += `[${this.moduleName}] `;
        }
        formattedMessage += `[${levelNames[level]}] `;
        formattedMessage += message;
        LoggerCollect.push(formattedMessage)
        return [formattedMessage, timestamp];
    }

    static getFileName() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        return `${year}-${month}-${day}.md`
    }

    log<T>(level: LoggerLevelType, message: string, ...args: T[]): void {
        const formatted = this.formatMessage(level, message);
        if (this.level <= level) {
            switch (level) {
                case LoggerLevel.ERROR:
                    console.error(`%c${formatted[0]}`, loggerColorMap[level], ...args);
                    break;
                case LoggerLevel.WARN:
                    console.warn(`%c${formatted[0]}`, loggerColorMap[level], ...args);
                    break;
                case LoggerLevel.DEBUG:
                    console.debug(`%c${formatted[0]}`, loggerColorMap[level], ...args);
                    break;
                case LoggerLevel.SUCCESS:
                    console.log(`%c${formatted[0]}`, loggerColorMap[level], ...args);
                    break;
                default:
                    console.log(`%c${formatted[0]}`, loggerColorMap[level], ...args);
                    break;
            }
        }
        const fileName = Logger.getFileName()
        const filePath = path.join(DOCS_DIR, fileName)
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '')
        }
        if (WRITE_LOG_COUNT === 0) {
            fs.appendFileSync(filePath, `## ${formatted[1]}\n`)
        }
        WRITE_LOG_COUNT++
        fs.appendFileSync(filePath, LoggerCollect.join('\n') + '\n')
        LoggerCollect.pop()
    }

    debug<T>(message: string, ...args: T[]): void {
        this.log(LoggerLevel.DEBUG, message, ...args);
    }

    info<T>(message: string, ...args: T[]): void {
        this.log(LoggerLevel.INFO, message, ...args);
    }

    warn<T>(message: string, ...args: T[]): void {
        this.log(LoggerLevel.WARN, message, ...args);
    }

    error<T>(message: string, ...args: T[]): void {
        this.log(LoggerLevel.ERROR, message, ...args);
    }

    success<T>(message: string, ...args: T[]): void {
        this.log(LoggerLevel.SUCCESS, message, ...args);
    }

    setLevel(level: LoggerLevelType): void {
        this.level = level;
    }

    setModuleName(moduleName: string): void {
        this.moduleName = moduleName;
    }

    setShowTimestamp(show: boolean): void {
        this.showTimestamp = show;
    }

    static notifyReset() {
        WRITE_LOG_COUNT = 0
        fs.appendFileSync(LoggerFilePath, '\n\n\n')
    }
}

export function createLogger(options: LoggerOptions = {}): Logger {
    return new Logger(options);
}

const defaultLogger = new Logger();
const debugLogger = new Logger({ level: LoggerLevel.DEBUG });
const warnLogger = new Logger({ level: LoggerLevel.WARN });
const errorLogger = new Logger({ level: LoggerLevel.ERROR });
const successLogger = new Logger({ level: LoggerLevel.SUCCESS });

export const DebugLogger = debugLogger.debug.bind(debugLogger);
export const InfoLogger = defaultLogger.info.bind(defaultLogger);
export const WarnLogger = warnLogger.warn.bind(warnLogger);
export const ErrorLogger = errorLogger.error.bind(errorLogger);
export const SuccessLogger = successLogger.success.bind(successLogger);

export const LoggerFileName = Logger.getFileName()
export const notifyReset = Logger.notifyReset
export const LoggerFilePath = path.join(DOCS_DIR, LoggerFileName)
export default Logger;
