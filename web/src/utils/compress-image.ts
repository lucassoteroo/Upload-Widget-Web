interface CompressImageParams {
    file: File,
    maxWidth?: number,
    maxHeight?: number,
    quality?: number
}

function convertToWebp(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.')

    if (lastDotIndex === -1) {
        return `${fileName}.webp`
    }

    return `${fileName.substring(0, lastDotIndex)}.webp`
}

export function compressImage({
    file,
    maxWidth = Number.POSITIVE_INFINITY,
    maxHeight = Number.POSITIVE_INFINITY,
    quality = 1    
}: CompressImageParams) {
    const allowedFileTypes = [
        'image/jpg',
        'image/jpeg',
        'image/png',
        'image/webp',
    ]

    if (!allowedFileTypes.includes(file.type)) {
        throw new Error('Image format not supported')
    }

    
    return new Promise<File>((resolve, reject) => {
        // api para ler arquivos aos poucos
        const reader = new FileReader()

        // vai ler e devolver os dados
        reader.onload = event => {
            // construir imagem
            const compressed = new Image()

            compressed.onload = () => {
                const canvas = document.createElement('canvas')

                let width = compressed.width
                let height = compressed.height

                // + larga do que alta
                if (width > height) {
                    if (width > maxWidth) {
                        width = maxWidth
                        height *= maxWidth / width
                    }
                } else {
                    if (height > maxHeight) {
                        height = maxHeight
                        width *= maxHeight / height
                    }
                }

                canvas.width = width
                canvas.height = height

                const context = canvas.getContext('2d')

                if (!context) {
                    reject('Failed to get canva context')
                    return
                }

                context.drawImage(compressed, 0, 0, width, height)

                canvas.toBlob(
                    blob => {
                        if (!blob) {
                            reject('Failed to compress image')
                            return
                        }

                        const compressedFile = new File(
                            [blob], 
                            convertToWebp(file.name),
                            {
                                type: 'image/webp',
                                lastModified: Date.now()
                            }
                        )   

                        resolve(compressedFile)
                    },
                    'image/webp',
                    quality
                )
            }
            
            compressed.src = event.target?.result as string
        }

        reader.readAsDataURL(file)
    })

}