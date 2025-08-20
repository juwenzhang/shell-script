import fs from 'fs'
import path from 'path'
import { translate } from '@vitalets/google-translate-api';

class GenerateI18n {
    async translate(text: string, to: string = 'en') {
        const { text: translatedText } = await translate(text, { to })
        return translatedText
    }

    async translateFile(filePath: string, outPutFilePath: string, to: string = 'en') {
        const text = fs.readFileSync(filePath, 'utf-8')
        const translatedText = await this.translate(text, to)
        if (!fs.existsSync(path.dirname(outPutFilePath))) {
            fs.mkdirSync(path.dirname(outPutFilePath), { recursive: true })
        }
        fs.writeFileSync(outPutFilePath, translatedText)
    }

    async translateDir(dirPath: string, outPutDirPath: string, to: string = 'en') {
        const files = fs.readdirSync(dirPath)
        for (const file of files) {
            const filePath = path.join(dirPath, file)
            const outPutFilePath = path.join(outPutDirPath, file)
            if (fs.statSync(filePath).isDirectory()) {
                await this.translateDir(filePath, outPutFilePath, to)
            } else {
                await this.translateFile(filePath, outPutFilePath, to)
            }
        }
    }

    async translateDirs(dirPaths: string[], to: string = 'en') {
        for (const dirPath of dirPaths) {
            await this.translateDir(dirPath, to)
        }
    }
}

const generateI18n = new GenerateI18n()
export default generateI18n;
