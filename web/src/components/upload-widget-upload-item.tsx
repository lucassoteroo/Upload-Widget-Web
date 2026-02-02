import { Download, ImageUp, Link2, RefreshCcw, X } from "lucide-react";
import { Button } from "./ui/button";
import * as Progress from "@radix-ui/react-progress";
import { motion } from "motion/react";
import { useUploads, type Upload } from "../store/uploads";
import { formatBytes } from "../utils/format-bytes";

interface UploadWidgetUploadItemProps {
    uploadId: string,
    upload: Upload
}

export function UploadWidgetUploadItem({ uploadId, upload }: UploadWidgetUploadItemProps) {
    const cancelUpload = useUploads(store => store.cancelUpload)

    const progress = Math.min(
        upload.compressSizeInBytes 
        ? Math.round((upload.uploadSizesInBytes * 100) / upload.originalSizeInBytes)
        : 0,
        100,
    )

    return (
        <motion.div 
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.4}}
            className="p-3 rounded-lg flex flex-col gap-3 shadow-shape-content bg-white/2 relative overflow-hidden"
            >
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium flex items-center gap-1">
                    <ImageUp className="size-3 text-zinc-300" strokeWidth={1.5} />
                    <span>{upload.name}</span>
                </span>

                <span className="text-xs text-zinc-400 flex gap-1.5 items-center">
                    <span className="line-through">{formatBytes(upload.originalSizeInBytes)}</span>
                    <div className="size-1 rounded-full bg-zinc-700" />
                    <span>
                        {formatBytes(upload.compressSizeInBytes ?? 0)}
                        {upload.compressSizeInBytes && (
                            <span className="text-green-400 ml-1">
                                -{Math.round((upload.originalSizeInBytes - upload.compressSizeInBytes) * 100 / upload.originalSizeInBytes)}%
                            </span>
                        )}
                    </span>
                    <div className="size-1 rounded-full bg-zinc-700" />
                    {upload.status === 'success' && <span>100%</span>}
                    {upload.status === 'progress' && <span>{ progress }%</span>}
                    {upload.status === 'error' && <span className="text-red-400">Error</span>}
                    {upload.status === 'canceled' && <span className="text-yellow-400">Canceled</span>}
                </span>
            </div>

            <Progress.Root 
                data-status={upload.status}
                className="group bg-zinc-800 rounded-full h-1 overflow-hidden"
                >
                <Progress.Indicator 
                    className="bg-indigo-500 h-1 group-data-[status=success]:bg-green-400 group-data-[status=error]:bg-red-400 group-data-[status=canceled]:bg-yellow-400 transition-all" 
                    style={{ width: upload.status === 'progress' ? `${progress}%` : '100%' }} 
                />
            </Progress.Root>

            {/* botão para fazer download da imagem */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                <Button 
                    aria-disabled={upload.status !== 'success'} asChild
                    size="icon-sm">
                        <a href={upload.remoteUrl} download>
                            <Download className="size-4" strokeWidth={1.5} />
                            <span className="sr-only">Download compressed image</span>
                        </a>
                </Button>

                {/* botão para copiar url da imagem */}
                <Button 
                    disabled={!upload.remoteUrl} 
                    onClick={() => upload.remoteUrl && navigator.clipboard.writeText(upload.remoteUrl)}
                    size="icon-sm"
                    >
                    <Link2 className="size-4" strokeWidth={1.5} />
                    <span className="sr-only">Copy remote url</span>
                </Button>

                {/* botão tentar fazer o upload da imagem novamente */}
                <Button 
                    disabled={!['canceled', 'error'].includes(upload.status)} 
                    size="icon-sm"
                    >
                    <RefreshCcw className="size-4" strokeWidth={1.5} />
                    <span className="sr-only">Retry upload</span>
                </Button>

                {/* botão para cancelar o upload da imagem */}
                <Button 
                    disabled={upload.status !== 'progress'} 
                    size="icon-sm" onClick={() => cancelUpload(uploadId)}
                    >
                    <X className="size-4" strokeWidth={1.5} />
                    <span className="sr-only">Cancel upload</span>
                </Button>                                                               
            </div>
        </motion.div>
    )
}