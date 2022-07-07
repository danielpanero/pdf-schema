import PDFDocument from 'pdfkit'

export interface PDFContext {
    font?: string
    fontSize?: number
    fillColor?: string
}

export interface PDFPage {
    options?: PDFKit.PDFDocumentOptions
    context?: PDFContext | string
    elements: PDFElement[]
}

export type PDFElement = PDFTextElement | PDFImageElement | PDFTableElement | PDFCustomElement
export interface PDFBaseElement {
    x?: number | 'left' | 'center' | 'right'
    y?: number | 'next-line' | 'previous-line' | 'top' | 'center' | 'bottom'
    context?: PDFContext | string,
    type: 'text' | 'image' | string
}

export interface PDFTextElement extends PDFBaseElement {
    type: 'text'
    text: string
    options?: PDFKit.Mixins.TextOptions
}

export interface PDFImageElement extends PDFBaseElement {
    type: 'image'
    image: string
    options?: PDFKit.Mixins.ImageOption
}

export interface PDFTableElement extends PDFBaseElement {
    type: 'table'
    width: number | string

    headerIndex?: number
    autoHeader?: boolean
    autoPage?: boolean
    grid?: 'vertical' | 'horizontal' | 'both' | 'T'
    rowHeight?: number
    padding?: number | number[]

    rows: PDFTableRow[]
}

export interface PDFTableRow {
    type: 'table-row'
    width?: number | string | 'fill-width'
    height?: number | 'auto'

    context?: PDFContext | string
    padding?: number | number[]
    backgroundColor?: string

    columns: PDFTableColumn[]
}

export interface PDFTableColumn {
    type: 'table-column'
    width?: number | string

    context?: PDFContext | string
    padding?: number | number[]
    backgroundColor?: string

    text: string
    options?: PDFKit.Mixins.TextOptions
}

export interface PDFCustomElement extends PDFBaseElement {
    type: string,
    [key: string]: unknown
}

export interface PDFSchema {
    mainContext: string | PDFContext
    globalContexts?: { [key: string]: PDFContext }
    options: PDFKit.PDFDocumentOptions

    mm?: boolean,
    images?: { [key: string]: string }

    pages: PDFPage[],
    pageHeader?: PDFElement[]
}

export interface ParsingOptions {
    customElementParser?: (doc: typeof PDFDocument, schema: PDFSchema, element: PDFElement) => PDFElement | void
    customContext?: (doc: typeof PDFDocument, schema: PDFSchema, context: string) => boolean
}
