interface PDFContext {
    font?: string
    fontSize?: number
    fillColor?: string
}

interface PDFPage {
    options?: PDFKit.PDFDocumentOptions
    context?: PDFContext | string
    elements: PDFElement[]
}

type PDFElement = PDFTextElement | PDFImageElement | PDFTableElement | PDFCustomElement
interface PDFBaseElement {
    x?: number | 'left' | 'center' | 'right'
    y?: number | 'next-line' | 'previous-line' | 'top' | 'center' | 'bottom'
    context?: PDFContext | string,
    type: 'text' | 'image' | string
}

interface PDFTextElement extends PDFBaseElement {
    type: 'text'
    text: string
    options?: PDFKit.Mixins.TextOptions
}

interface PDFImageElement extends PDFBaseElement {
    type: 'image'
    image: string
    options?: PDFKit.Mixins.ImageOption
}

interface PDFTableElement extends PDFBaseElement {
    type: 'table'
    width: number | string | 'fill-width'
    height?: number | string | 'fill-height'

    headerIndex?: number
    autoHeader?: boolean
    grid?: 'vertical' | 'horizontal' | 'both'
    bordered?: boolean

    rows: (PDFTableRow | PDFElement)[]
}

interface PDFTableRow {
    type: 'table-row'
    width?: number | string | 'fill-width'
    height?: number | string

    context?: PDFContext | string
    padding?: number | number[]
    backgroundColor?: string

    columns: (PDFTableColumn | PDFElement)[]
}

interface PDFTableColumn {
    type: 'table-column'
    width?: number | string
    height?: number

    padding?: number | number[]

    element: string | PDFElement
}

interface PDFCustomElement extends PDFBaseElement {
    type: string,
    [key: string]: unknown
}

interface PDFSchema {
    mainContext: string | PDFContext
    globalContexts?: { [key: string]: PDFContext }
    options: PDFKit.PDFDocumentOptions

    mm?: boolean,
    images?: { [key: string]: string }

    pages: PDFPage[],
    pageHeader?: PDFElement[]
}

export {
    PDFSchema, PDFContext, PDFPage, PDFElement, PDFTextElement, PDFImageElement, PDFCustomElement
}