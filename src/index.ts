import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'

import { PDFSchema, PDFContext, PDFPage, PDFElement, PDFTextElement, PDFImageElement } from './types'

const applyContext = (doc: typeof PDFDocument, schema: PDFSchema, context: PDFContext | string, options: ParsingOptions) => {
    if (typeof context == "string") {
        if (schema.globalContexts && schema.globalContexts[context]) {
            context = schema.globalContexts[context]
        } else {
            if (options.customContext) {
                return options.customContext(doc, schema, context)
            } else {
                throw `Context "${context}" was not found`
            }
        }
    }
    Object.entries(context).map(([key, value]) => {
        switch (key) {
            case 'font':
                doc.font(value)
                break

            case 'fontSize':
                doc.fontSize(value)
                break

            case 'fillColor':
                doc.fillColor(value);
                break
        }
    })
}

const parseCoordinates = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFElement) => {
    if (element.x) {
        doc.moveTo(element.x, doc.y)
    }

    if (element.y) {
        if (typeof element.y == 'number') {
            doc.moveTo(doc.x, element.y)
        } else {
            switch (element.y) {
                case 'next-line':
                    doc.moveDown()
                    break

                case 'previous-line':
                    doc.moveUp()
                    break
            }
        }
    }
}

const parseText = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFTextElement) => {
    doc.text(element.text, element.options)
}

const parseImage = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFImageElement) => {
    doc.image(element.image, element.options)
}

const parseElement = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFElement, options: ParsingOptions) => {
    if (element.context) {
        applyContext(doc, schema, element.context, options)
    }

    parseCoordinates(doc, schema, element)

    switch (element.type) {
        case 'text':
            parseText(doc, schema, element as PDFTextElement)
            break

        case 'image':
            parseImage(doc, schema, element as PDFImageElement)
            break

        default:
            if (options.customElementParser) {
                options.customElementParser(doc, schema, element)
            } else {
                throw `Element "${element.type}" can't be parsed (either no customElementParser was defined or it wasn't a supported type: text, image...)`
            }
    }
}

const parsePage = (doc: typeof PDFDocument, schema: PDFSchema, page: PDFPage, options: ParsingOptions) => {
    if (page.options) {
        doc.addPage(page.options)
    }
    doc.addPage()

    if (schema.pageHeader) {
        schema.pageHeader.forEach(element => parseElement(doc, schema, element, options))
    }

    page.elements.forEach(element => {
        if (page.context) {
            applyContext(doc, schema, page.context, options)
        }

        parseElement(doc, schema, element, options)
    })
}

interface ParsingOptions {
    customElementParser?: (doc: typeof PDFDocument, schema: PDFSchema, element: PDFElement) => void
    customContext?: (doc: typeof PDFDocument, schema: PDFSchema, context: string) => void
}

const parseSchema = (schema: PDFSchema, options: ParsingOptions = {}): Promise<BlobPart[]> => {
    const doc = new PDFDocument(schema.options);

    const stream = new PassThrough()
    const dataBuffers: BlobPart[] = []

    doc.pipe(stream)
    stream.on('data', (chunck: BlobPart) => dataBuffers.push(chunck))

    schema.pages.forEach(page => {
        if (schema.mainContext) {
            applyContext(doc, schema, schema.mainContext, options)
        }

        parsePage(doc, schema, page, options)
    })

    doc.end()
    return new Promise((resolve) => {
        stream.on('end', () => resolve(dataBuffers))
    })
}

export default parseSchema