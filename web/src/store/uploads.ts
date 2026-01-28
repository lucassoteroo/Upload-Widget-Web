// local de armazenamento de estados
import { create } from "zustand";

export type Upload = {
    name: string,
    file: File
}

type UploadState = {
    uploads: Map<string, Upload>
    addUploads: (file: File[]) => void
}

// gerenciamento de estado de criação de uploads
export const useUploads = create<UploadState>((set, get) => {
    function addUploads(files: File[]) {
        for (const file of files) {
            const uploadId = crypto.randomUUID()

            const upload: Upload = {
                name: file.name,
                file
            }

            // atribui um valor ao estado
            set(state => {
                return { uploads: state.uploads.set(uploadId, upload) }
            })
        }
    }

    return {
        uploads: new Map(),
        addUploads,
    }
})