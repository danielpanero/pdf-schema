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

const parseCoordinates = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFElement, width: number, height: number) => {
    if (element.x) {
        if (typeof element.x == 'string') {
            switch (element.x) {
                case 'left':
                    doc.moveTo(0, doc.y)
                    break

                case 'center':
                    doc.moveTo((doc.page.width - width) / 2, doc.y)
                    break

                case 'right':
                    doc.moveTo(doc.page.width - width, doc.y)
                    break

            }
        } else {
            doc.moveTo(element.x, doc.y)
        }
    }

    if (element.y) {
        if (typeof element.y == 'string') {
            switch (element.y) {
                case 'previous-line':
                    doc.moveUp()
                    break

                case 'next-line':
                    doc.moveDown()
                    break

                case 'top':
                    doc.moveTo(doc.x, 0)
                    break

                case 'center':
                    doc.moveTo(doc.x, (doc.page.height - height) / 2)
                    break

                case 'bottom':
                    doc.moveTo(doc.x, (doc.page.height - height))
                    break
            }
        } else {
            doc.moveTo(doc.x, element.y)
        }
    }
}

const parseText = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFTextElement, options: ParsingOptions) => {
    if (element.context) {
        applyContext(doc, schema, element.context, options)
    }

    const width = doc.widthOfString(element.text, element.options)
    const height = doc.heightOfString(element.text, element.options)

    parseCoordinates(doc, schema, element, width, height)

    doc.text(element.text, element.options)
}

const parseImage = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFImageElement, options: ParsingOptions) => {
    if (element.context) {
        applyContext(doc, schema, element.context, options)
    }

    //FIXME(@danielpanero): dix in the case that options where provided
    const image = doc.openImage(element.image)

    parseCoordinates(doc, schema, element, image.width, image.height)

    doc.image(element.image, element.options)
}

// TODO(@danielpanero): change this in a function that simply accepts an object with {[type:string]}: Fn
const parseElement = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFElement, options: ParsingOptions) => {
    switch (element.type) {
        case 'text':
            parseText(doc, schema, element as PDFTextElement, options)
            break

        case 'image':
            parseImage(doc, schema, element as PDFImageElement, options)
            break

        default:
            if (!options.customElementParser || !options.customElementParser(doc, schema, element)) {
                throw `Element "${element.type}" can't be parsed (either no customElementParser was defined or it wasn't a supported type: text, image...)`
            }
    }
}

const parsePage = (doc: typeof PDFDocument, schema: PDFSchema, page: PDFPage, options: ParsingOptions) => {
    // TODO(@danielpanero): support for images at page level
    if (page.options) {
        doc.addPage(page.options)
    } else {
        doc.addPage()
    }

    if (schema.pageHeader) {
        schema.pageHeader.forEach(element => parseElement(doc, schema, element, options))
    }

    page.elements.forEach(element => {
        if (schema.mainContext) {
            applyContext(doc, schema, schema.mainContext, options)
        }

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

    if (schema.images) {
        Object.entries(schema.images).map(([key, src]) => {
            doc._imageRegistry[key] = doc.openImage(src)
        })
    }

    schema.pages.forEach(page => {
        if (schema.mainContext) {
            applyContext(doc, schema, schema.mainContext, options)
        }

        parsePage(doc, schema, page, options)
    })

    return doc
}

export default parseSchema