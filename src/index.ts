import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'

import { PDFSchema, PDFContext, PDFPage, PDFElement } from './types'

const applyContext = (doc: typeof PDFDocument, schema: PDFSchema, context: PDFContext | string) => {
    if (typeof context == "string" && schema.globalContexts && schema.globalContexts[context]) {
        context = schema.globalContexts[context]
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

const parseElement = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFElement) => {
    if (element.context) {
        applyContext(doc, schema, element.context)
    }

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


    switch (element.type) {
        case 'text':
            break
        case 'image':
            break
    }
}

const parsePage = (doc: typeof PDFDocument, schema: PDFSchema, page: PDFPage) => {
    if (page.options) {
        doc.addPage(page.options)
    }
    doc.addPage()

    if (schema.pageHeader) {
        schema.pageHeader.forEach(element => parseElement(doc, schema, element))
    }

    page.elements.forEach(element => {
        if (page.context) {
            applyContext(doc, schema, page.context)
        }

        parseElement(doc, schema, element)
    })
}

const parseSchema = (schema: PDFSchema, options?: {}): Promise<BlobPart[]> => {
    const doc = new PDFDocument(schema.options);

    const stream = new PassThrough()
    const dataBuffers: BlobPart[] = []

    doc.pipe(stream)
    stream.on('data', (chunck: BlobPart) => dataBuffers.push(chunck))

    schema.pages.forEach(page => {
        if (schema.mainContext) {
            applyContext(doc, schema, schema.mainContext)
        }

        parsePage(doc, schema, page)
    })

    doc.end()
    return new Promise((resolve) => {
        stream.on('end', () => resolve(dataBuffers))
    })
}

export default parseSchema