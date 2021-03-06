import PDFDocument from 'pdfkit'

import { PDFElement, PDFImageElement, PDFPage, PDFSchema, PDFTableElement, PDFTextElement, ParsingOptions } from './types'

import { applyContext, parseCoordinates } from './util'
import { parseTable } from './table'

export const parseText = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFTextElement, options: ParsingOptions) => {
    if (element.context) {
        applyContext(doc, schema, element.context, options)
    }

    const width = doc.widthOfString(element.text, element.options)
    const height = doc.heightOfString(element.text, element.options)

    parseCoordinates(doc, schema, element, width, height)

    doc.text(element.text, element.options)
}

export const parseImage = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFImageElement, options: ParsingOptions) => {
    if (element.context) {
        applyContext(doc, schema, element.context, options)
    }

    //FIXME(@danielpanero): dix in the case that options where provided
    const image = doc.openImage(element.image)

    parseCoordinates(doc, schema, element, image.width, image.height)

    doc.image(element.image, element.options)
}

// TODO(@danielpanero): change this in a function that simply accepts an object with {[type:string]}: Fn
export const parseElement = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFElement, options: ParsingOptions) => {
    switch (element.type) {
        case 'text':
            parseText(doc, schema, element as PDFTextElement, options)
            break

        case 'image':
            parseImage(doc, schema, element as PDFImageElement, options)
            break

        case 'table':
            parseTable(doc, schema, element as PDFTableElement, options)
            break

        default:
            if (!options.customElementParser) {
                throw `Element "${element.type}" can't be parsed (either no customElementParser was defined or it wasn't a supported type: text, image...)`
            }

            const result = options.customElementParser(doc, schema, element)
            if(result) {
                parseElement(doc, result, options)
            }
    }
}

export const parsePage = (doc: typeof PDFDocument, schema: PDFSchema, page: PDFPage, options: ParsingOptions) => {
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

export const parseSchema = (schema: PDFSchema, stream: NodeJS.WritableStream, options: ParsingOptions = {}) => {
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