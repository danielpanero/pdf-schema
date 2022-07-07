import PDFDocument from 'pdfkit'

import { PDFContext, PDFElement, PDFSchema, ParsingOptions } from './types'

export const applyContext = (doc: typeof PDFDocument, schema: PDFSchema, context: PDFContext | string, options: ParsingOptions) => {
    if (typeof context == 'string') {
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

export const parseCoordinates = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFElement, width: number, height: number) => {
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