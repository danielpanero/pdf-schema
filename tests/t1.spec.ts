import { describe, expect, test } from '@jest/globals'
import { createWriteStream } from 'fs'

import { exec } from 'child_process'

import PDFSchemaParser from '../src/index'
import { PDFSchema } from '../src/types'

const tests: { [key: string]: PDFSchema } = {
    "test1": {
        mainContext: {},
        options: {
            size: "A4"
        },
        pages: [{
            elements: [{
                type: "text",
                text: "Ciao sono Dniael"
            }]
        }]
    }
}

describe("Testing multiple snapshots", () => {
    test.each(Object.entries(tests))("%p", async (filename: string, schema: PDFSchema) => {
        const stream = createWriteStream(`${__dirname}/tmp/${filename}.pdf`)
        const doc = PDFSchemaParser(schema, stream)
        doc.end()

        stream.on("error", (error) => {
            throw error
        })

        const result = new Promise((resolve, rejects) => {
            stream.on("finish", () => {
                exec(`diff-pdf ${__dirname}/tmp/${filename}.pdf ${__dirname}/__snapshots__/${filename}.pdf`, (error, stdout, stderr) => {
                    if (error) {
                        switch (error.code) {
                            case 1:
                                rejects(`tmp/${filename}.pdf doesn't corresponds to __snapshots__/${filename}.pdf`)
                                break
                            default:
                                rejects(error.message)
                                break
                        }
                    }
                    resolve(true)
                })
            })
        })

        await expect(result).resolves.not.toThrow()
    })
})

