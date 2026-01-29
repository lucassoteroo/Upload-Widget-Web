// local de armazenamento de estados
import { immer } from 'zustand/middleware/immer'
import { create } from "zustand";
import { enableMapSet } from 'immer';
import { uploadFileToStorage } from '../http/upload-file-to-storage';

export type Upload = {
    name: string,
    file: File,
    abortController: AbortController
    status: 'progress' | 'success' | 'error' | 'canceled'
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
                    { file: upload.file },
                    { signal: upload.abortController.signal }
                )
    
                set(state => {
                    state.uploads.set(uploadId, {
                        ...upload,
                        status: 'success'
                    })
                })            
            } catch {
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
                    status: 'progress'
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

            // atribui um valor ao estado
            set(state => {
                state.uploads.set(uploadId, {
                    ...upload,
                    status: 'canceled'
                })
            })
        }

        return {
            uploads: new Map(),
            addUploads,
            cancelUpload
        }
    })
)