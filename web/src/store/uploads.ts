// local de armazenamento de estados
import { immer } from 'zustand/middleware/immer'
import { create } from "zustand";
import { enableMapSet } from 'immer';
import { uploadFileToStorage } from '../http/upload-file-to-storage';

export type Upload = {
    name: string,
    file: File
}

type UploadState = {
    uploads: Map<string, Upload>
    addUploads: (file: File[]) => void
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

            await uploadFileToStorage({ file: upload.file })
        }

        function addUploads(files: File[]) {
            for (const file of files) {
                const uploadId = crypto.randomUUID()

                const upload: Upload = {
                    name: file.name,
                    file
                }

                // atribui um valor ao estado
                set(state => {
                    state.uploads.set(uploadId, upload)
                })

                processUpload(uploadId)
            }
        }

        return {
            uploads: new Map(),
            addUploads,
        }
    })
)