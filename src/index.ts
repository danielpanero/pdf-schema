import PDFDocument from 'pdfkit'

import { PDFSchema, PDFContext, PDFPage, PDFElement, PDFTextElement, PDFImageElement } from './types'

const applyContext = (doc: typeof PDFDocument, schema: PDFSchema, context: PDFContext | string, options: ParsingOptions) => {
    if (typeof context == "string") {
        if (schema.globalContexts && schema.globalContexts[context]) {
            context = schema.globalContexts[context]
        } else {
            if (!options.customContext || !options.customContext(doc, schema, context)) {
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
    // TODO(@danielpanero): Add block alignement (even if aligned to the right is fixed to the left) or bottom / top
    doc.text(element.text, element.options)
}

const parseImage = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFImageElement) => {
    // TODO(@danielpanero): control if element.image is base64, if not check in the schema image at page level, or document level
    // TODO(@danielpanero): support for aligned left / right
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
            if (!options.customElementParser || !options.customElementParser(doc, schema, element)) {
                throw `Element "${element.type}" can't be parsed (either no customElementParser was defined or it wasn't a supported type: text, image...)`
            }
    }
}

const parsePage = (doc: typeof PDFDocument, schema: PDFSchema, page: PDFPage, options: ParsingOptions) => {
    if (page.options) {
        doc.addPage(page.options)
    } else {
        doc.addPage()
    }

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
    customElementParser?: (doc: typeof PDFDocument, schema: PDFSchema, element: PDFElement) => boolean
    customContext?: (doc: typeof PDFDocument, schema: PDFSchema, context: string) => boolean
}

const parseSchema = (schema: PDFSchema, stream: NodeJS.WritableStream, options: ParsingOptions = {}) => {
    const doc = new PDFDocument(schema.options);

    doc.pipe(stream)

    schema.pages.forEach(page => {
        if (schema.mainContext) {
            applyContext(doc, schema, schema.mainContext, options)
        }

        parsePage(doc, schema, page, options)
    })

    return doc
}

export default parseSchema