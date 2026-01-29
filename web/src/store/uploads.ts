// local de armazenamento de estados
import { immer } from 'zustand/middleware/immer'
import { create } from "zustand";
import { enableMapSet } from 'immer';
import { uploadFileToStorage } from '../http/upload-file-to-storage';
import { CanceledError } from 'axios';

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

// gerenciamento de estado de criação de uploads
export const useUploads = create<UploadState, [['zustand/immer', never]]>(
    immer((set, get) => {
        async function processUpload(uploadId: string) {
            const upload = get().uploads.get(uploadId)

            if (!upload) {
                return
            }

            try {
                await uploadFileToStorage(
                    { 
                        file: upload.file,
                        onProgress(sizeInBytes) {
                            set(state => {
                                // atribui um valor ao estado
                                state.uploads.set(uploadId, {
                                    ...upload,
                                    uploadSizesInBytes: sizeInBytes
                                })
                            })   
                        }
                    },
                    { signal: upload.abortController.signal }
                )
    
                set(state => {
                    // atribui um valor ao estado
                    state.uploads.set(uploadId, {
                        ...upload,
                        status: 'success'
                    })
                })            
            } catch (err) {
                if (err instanceof CanceledError) {
                    // atribui um valor ao estado
                    set(state => {
                        state.uploads.set(uploadId, {
                            ...upload,
                            status: 'canceled'
                        })
                    })    

                    return
                }

                // atribui um valor ao estado
                set(state => {
                    state.uploads.set(uploadId, {
                        ...upload,
                        status: 'error'
                    })
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