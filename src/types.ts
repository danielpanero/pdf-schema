interface PDFContext {
    font?: string,
    fontSize?: number,
    fillColor?: string,
}

interface PDFPage {
    options?: PDFKit.PDFDocumentOptions,
    context?: PDFContext | string,
    elements: PDFElement[]
}

type PDFElement = PDFTextElement | PDFImageElement | PDFCustomElement
interface PDFBaseElement {
    x?: number,
    y?: number | "next-line" | "previous-line"
    context?: PDFContext | string,
    type: 'text' | 'image' | string
}

interface PDFTextElement extends PDFBaseElement {
    type: 'text',
    text: string,
    options?: PDFKit.Mixins.TextOptions
}

interface PDFImageElement extends PDFBaseElement {
    type: 'image',
    image: string,
    options?: PDFKit.Mixins.ImageOption
}

interface PDFCustomElement extends PDFBaseElement {
    type: string,
}

interface PDFSchema {
    mainContext: string | PDFContext
    globalContexts?: { [key: string]: PDFContext },
    options: PDFKit.PDFDocumentOptions,

    mm: boolean,
    images: { [key: string]: string },

    pages: PDFPage[],
    pageHeader?: PDFElement[]
}

export {
    PDFSchema, PDFContext, PDFPage, PDFElement
}