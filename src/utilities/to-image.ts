export async function toImage(
    domNode: HTMLElement,
    opts: { format?: 'png' | 'jpeg' | 'webp'; width?: number; height?: number }
) {
    const format = opts.format || 'png'
    const width = opts.width || domNode.clientWidth
    const height = opts.height || domNode.clientHeight

    // find the SVG inside your plot container
    const svgEl = domNode.querySelector('svg')
    if (!svgEl) throw new Error('No SVG found in container')

    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgEl)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get canvas context')

    const img = new Image()
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    return new Promise<string>((resolve, reject) => {
        img.onload = () => {
            ctx.clearRect(0, 0, width, height)
            ctx.drawImage(img, 0, 0, width, height)
            URL.revokeObjectURL(url)
            canvas.toBlob(blob => {
                if (!blob) return reject(new Error('Failed to convert to blob'))
                const dataUrl = URL.createObjectURL(blob)
                resolve(dataUrl)
            }, `image/${format}`)
        }
        img.onerror = reject
        img.src = url
    })
}
