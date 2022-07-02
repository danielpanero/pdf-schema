type OpenImageProps = {
    label: string
    image: {
        data: Blob
        pos: number
        palette: unknown[]
        imgData: Blob
        transparency: unknown
        text: unknown
        width: number
        height: number
        bits: number
        colorType: number
        compressionMethod: number
        interlaceMethod: number
        colors: number
        hasAlphaChannel: boolean
        pixelBitlength: number
        colorSpace: string
    }
    width: number
    height: number
    imgData: Blob
    obj: unknown
}

declare namespace PDFKit {
    interface PDFDocument {
        openImage(path: string): OpenImageProps
    }
}