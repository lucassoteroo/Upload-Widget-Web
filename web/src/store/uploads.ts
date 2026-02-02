// local de armazenamento de estados
import { immer } from 'zustand/middleware/immer'
import { create } from "zustand";
import { enableMapSet } from 'immer';
import { uploadFileToStorage } from '../http/upload-file-to-storage';
import { CanceledError } from 'axios';
import { useShallow } from 'zustand/shallow';
import { compressImage } from '../utils/compress-image';

export type Upload = {
    name: string,
    file: File,
    abortController: AbortController
    status: 'progress' | 'success' | 'error' | 'canceled'
    originalSizeInBytes: number
    uploadSizesInBytes: number
}

type UploadState = {
    uploads: Map<string, Upload>
    addUploads: (file: File[]) => void
    cancelUpload: (uploadId: string) => void
}

enableMapSet()

// rookie
// gerenciamento de estado de criação de uploads
export const useUploads = create<UploadState, [['zustand/immer', never]]>(
    immer((set, get) => {
        function updateUploads(uploadId: string, data: Partial<Upload>) {
            const upload = get().uploads.get(uploadId)

            if (!upload) {
                return
            }

            set(state => {
                state.uploads.set(uploadId, {...upload, ...data})
            })
        }

        async function processUpload(uploadId: string) {
            const upload = get().uploads.get(uploadId)

            if (!upload) {
                return
            }

            try {
                const compressedFile = await compressImage({
                    file: upload.file,
                    maxWidth: 200,
                    maxHeight: 200,
                    quality: 0.5
                })

                await uploadFileToStorage(
                    { 
                        file: compressedFile,
                        onProgress(sizeInBytes) {
                            // atribui um valor ao estado
                            updateUploads(uploadId, {
                                uploadSizesInBytes: sizeInBytes
                            })
                        }
                    },
                    { signal: upload.abortController.signal }
                )
    
                // atribui um valor ao estado
                updateUploads(uploadId, {
                    status: 'success'
                })
            } catch (err) {
                if (err instanceof CanceledError) {
                    // atribui um valor ao estado
                    updateUploads(uploadId, {
                        status: 'canceled'
                    })

                    return
                }

                // atribui um valor ao estado
                updateUploads(uploadId, {
                    status: 'error'
                })    
            }
        }
        
        function addUploads(files: File[]) {
            for (const file of files) {
                const uploadId = crypto.randomUUID()
                const abortController = new AbortController()
                
                const upload: Upload = {
                    name: file.name,
                    file,
                    abortController,
                    status: 'progress',
                    originalSizeInBytes: file.size,
                    uploadSizesInBytes: 0
                }
                
                // atribui um valor ao estado
                set(state => {
                    state.uploads.set(uploadId, upload)
                })
                
                processUpload(uploadId)
            }
        }
        
        function cancelUpload(uploadId: string) {
            const upload = get().uploads.get(uploadId)

            if (!upload) {
                return
            }

            upload.abortController.abort()
        }

        return {
            uploads: new Map(),
            addUploads,
            cancelUpload
        }
    })
)

// gerenciando o estado do uploads pendentes
export const usePendingUploads = () => {
    return useUploads(useShallow(store => {
        const isThereAnyPendingUploads = Array.from(store.uploads.values()).some(upload => upload.status === 'progress')

        if (!isThereAnyPendingUploads) {
            return { isThereAnyPendingUploads, globalPercentage: 100 }
        }

        const {
            total, uploaded
        } = Array.from(store.uploads.values()).reduce(
            (acc, upload) => {
                acc.total += upload.originalSizeInBytes
                acc.uploaded += upload.uploadSizesInBytes

                return acc
            },
            { total: 0, uploaded: 0}
        )

        const globalPercentage = Math.min(
            Math.round((uploaded * 100) / total),
            100
        )

        return {
            isThereAnyPendingUploads,
            globalPercentage
        }
    }))
}