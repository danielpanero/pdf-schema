import PDFDocument from 'pdfkit'

import { applyContext } from 'src'

import { PDFContext, PDFElement, PDFImageElement, PDFPage, PDFSchema, PDFTableElement, PDFTextElement, ParsingOptions, PDFCustomElement, PDFTableRow, PDFTableColumn } from './types'

const getRemainingWidthAndAutoCount = (row: PDFTableRow, tableWidth: number) => {
    let remainingWidth = tableWidth
    let autoWidthCount = 0
    for (const col of row.columns) {
        if (col.width) {
            if (typeof col.width == 'number') {
                remainingWidth -= col.width
            } else {
                remainingWidth -= tableWidth * parseFloat(col.width) / 100
            }
        } else {
            autoWidthCount++
        }
    }

    return { remainingWidth, autoWidthCount }
}

const getColWidth = (col: PDFTableColumn, tableWidth: number, remainingWidth: number, autoWidthCount: number) => {
    if (col.width && typeof col.width == 'string') {
        return tableWidth * parseFloat(col.width) / 100
    }
    return remainingWidth / autoWidthCount
}

const getRowHeight = (doc: typeof PDFDocument, table: PDFTableElement, row: PDFTableRow, tableWidth: number) => {
    if (row.height) {
        if (typeof row.height == 'number') {
            return row.height
        } else {
            let { remainingWidth, autoWidthCount } = getRemainingWidthAndAutoCount(row, tableWidth)

            let maxRowHeight = 0

            for (const col of row.columns) {
                let colWidth = getColWidth(col, tableWidth, remainingWidth, autoWidthCount)

                const padding = getColPadding(table, row, col)
                const width = colWidth - (padding[1] + padding[3])
                const textOptions = Object.assign({}, col.options, { width } as PDFKit.Mixins.TextOptions)

                const rowHeight = doc.heightOfString(col.text, textOptions)

                if (rowHeight > maxRowHeight) {
                    maxRowHeight = rowHeight
                }
            }

            return maxRowHeight
        }
    }

    if (table.rowHeight) {
        return table.rowHeight
    }

    return 30
}

const getColPadding = (table: PDFTableElement, row: PDFTableRow, col: PDFTableColumn): number[] => {
    if (col.padding) {
        if (typeof col.padding == 'number') {
            return [col.padding, col.padding, col.padding, col.padding]
        }

        return col.padding
    }

    if (row.padding) {
        if (typeof row.padding == 'number') {
            return [row.padding, row.padding, row.padding, row.padding]
        }

        return row.padding
    }

    if (table.padding) {
        if (typeof table.padding == 'number') {
            return [table.padding, table.padding, table.padding, table.padding]
        }

        return table.padding
    }

    return [5, 5, 5, 5]
}

export const parseTableRow = (doc: typeof PDFDocument, schema: PDFSchema, table: PDFTableElement, row: PDFTableRow, rowHeight: number, tableWidth: number, tableX: number, tableY: number, options: ParsingOptions) => {
    const { remainingWidth, autoWidthCount } = getRemainingWidthAndAutoCount(row, tableWidth)

    if (row.backgroundColor) {
        doc.rect(tableX, tableY, tableWidth, rowHeight).fill(row.backgroundColor)
    }

    let currentTableX = tableX
    for (const col of row.columns) {
        let colWidth = getColWidth(col, tableWidth, remainingWidth, autoWidthCount)

        if (row.context) {
            applyContext(doc, schema, row.context, options)
        }

        if (col.context) {
            applyContext(doc, schema, col.context, options)
        }

        if (col.backgroundColor) {
            doc.rect(currentTableX, tableY, currentTableX + colWidth, rowHeight).fill(col.backgroundColor)
        }

        if (table.grid == 'T' || table.grid == 'both' || table.grid == 'vertical') {
            doc.moveTo(currentTableX, tableY).lineTo(currentTableX, tableY + rowHeight).stroke()
        }

        const padding = getColPadding(table, row, col)

        const x = currentTableX + padding[3]
        const y = tableY + padding[0]
        const width = colWidth - (padding[1] + padding[3])
        const height = rowHeight - (padding[0] + padding[2])

        const textOptions = Object.assign({}, col.options, { width, height } as PDFKit.Mixins.TextOptions)

        doc.text(col.text, x, y, textOptions)

        currentTableX += colWidth
    }

}

export const parseTable = (doc: typeof PDFDocument, schema: PDFSchema, element: PDFTableElement, options: ParsingOptions) => {
    let tableX = doc.x
    let tableY = doc.y

    let tableWidth = doc.page.width
    if (element.width) {
        if (typeof element.width == 'string') {
            tableWidth = doc.page.width * parseFloat(element.width) / 100
        } else {
            tableWidth = element.width
        }
    }

    const tableHeight = element.rows.reduce((value: number, row) => value + getRowHeight(doc, element, row, tableWidth), 0)

    if (element.y) {
        if (typeof element.y == 'string') {
            switch (element.y) {
                case 'previous-line':
                    doc.moveUp()
                    tableY = doc.y
                    break

                case 'next-line':
                    doc.moveDown()
                    tableY = doc.y
                    break

                case 'top':
                    tableY = 0
                    break

                case 'center':
                    tableY = (doc.page.height - tableHeight) / 2
                    break

                case 'bottom':
                    tableY = doc.page.height - tableHeight
                    break
            }
        } else {
            tableY = element.y
        }
    }

    if (element.x) {
        if (typeof element.x == 'string') {
            switch (element.x) {
                case 'left':
                    tableX = 0
                    break

                case 'center':
                    tableX = (doc.page.width - tableWidth) / 2
                    break

                case 'right':
                    tableX = doc.page.width - tableWidth
                    break
            }
        } else {
            tableX = element.x
        }
    }

    doc.x = tableX
    doc.y = tableY

    let headerRow: PDFTableRow | undefined
    let headerRowHeight: number = 0
    if (typeof element.headerIndex == 'number') {
        headerRow = element.rows[element.headerIndex]
        element.rows.splice(element.headerIndex, 1)

        headerRowHeight = getRowHeight(doc, element, headerRow, tableWidth)

        parseTableRow(doc, schema, element, headerRow, headerRowHeight, tableWidth, tableX, tableY, options)
        tableY += getRowHeight(doc, element, headerRow, tableWidth)

        if (element.grid == 'T' || element.grid == 'both' || element.grid == 'horizontal') {
            doc.moveTo(tableX, tableY).lineTo(tableX + tableWidth, tableY).stroke()
        }
    }

    for (const row of element.rows) {
        const rowHeight = getRowHeight(doc, element, row, tableWidth)

        if (tableY + rowHeight >= doc.page.height) {
            if (element.autoPage) {
                doc.addPage()

                if (element.autoHeader && headerRow) {
                    parseTableRow(doc, schema, element, headerRow, headerRowHeight, tableWidth, tableX, tableY, options)
                    tableY += headerRowHeight

                    if (element.grid == 'T' || element.grid == 'both' || element.grid == 'horizontal') {
                        doc.moveTo(tableX, tableY).lineTo(tableX + tableWidth, tableY).stroke()
                    }
                }
            } else {
                break
            }
        }

        doc.x = tableX
        doc.y = tableY

        parseTableRow(doc, schema, element, row, rowHeight, tableWidth, tableX, tableY, options)
        tableY += rowHeight

        if (element.grid == 'both' || element.grid == 'horizontal') {
            doc.moveTo(tableX, tableY).lineTo(tableX + tableWidth, tableY).stroke()
        }
    }
}