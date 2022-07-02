import { describe, expect, test } from '@jest/globals'
import { createWriteStream } from 'fs'

import { exec } from 'child_process'

import PDFSchemaParser from '../src/index'
import { PDFSchema } from '../src/types'

const tests: { [key: string]: PDFSchema } = {
    "empty_page": {
        mainContext: {},
        options: {
            size: "A4",
            autoFirstPage: false
        },
        pages: []
    },
    "text_multiple_page": {
        mainContext: {},
        options: {
            size: "A4",
            autoFirstPage: false
        },
        globalContexts: {
            h1: {
                font: "Helvetica-Bold",
                fontSize: 25
            },
            h3: {
                font: "Helvetica",
                fontSize: 13,
                fillColor: "red"
            }
        },
        pages: [{
            elements: [{
                type: "text",
                text: "First",
                context: "h1"
            }]
        },
        {
            elements: [{
                x: 200,
                y: 200,
                type: "text",
                text: "Second",
                context: "h3"
            }]
        },
        {
            elements: [{
                x: 200,
                y: 200,
                type: "text",
                text: "Third",
            }]
        },
        {
            elements: [{
                x: 200,
                y: "next-line",
                type: "text",
                text: "Third",
                context: {
                    fillColor: "blue"
                }
            }]
        }]
    }
}

describe("Testing multiple snapshots", () => {
    test.concurrent.each(Object.entries(tests))("%p", async (filename: string, schema: PDFSchema) => {
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

