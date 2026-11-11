import fs from fs
import path from path
import os from os
import { PDFDocument } from pdf-lib
import sharp from sharp

const TEMP_DIR = path.join(os.tmpdir(), kenzie-imgtopdf)

export function ensureTempDir() {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true })
    }
}

export async function createPdf(imageBuffers) {
    const pdf = await PDFDocument.create()

    for (const buffer of imageBuffers) {
        const png = await sharp(buffer)
            .rotate()
            .png()
            .toBuffer()

        const meta = await sharp(png).metadata()

        const img = await pdf.embedPng(png)

        const page = pdf.addPage([595.28, 841.89])

        const scale = Math.min(
            555 / meta.width,
            801 / meta.height
        )

        const width = meta.width * scale
        const height = meta.height * scale

        page.drawImage(img, {
            x: (595.28 - width) / 2,
            y: (841.89 - height) / 2,
            width,
            height
        })

        page.drawText(
            global.botName || KENZIE BOT MD,
            {
                x: 20,
                y: 15,
                size: 8
            }
        )
    }

    return Buffer.from(await pdf.save())
}
