import * as Collapsible  from "@radix-ui/react-collapsible";
import { UploadWidgetDropzone } from "./upload-widget-dropzone";
import { UploadWidgetHeader } from "./upload-widget-header";
import { UploadWidgetUploadList } from "./upload-widget-upload-list";
import { UploadWidgetMinimizedButton } from "./upload-widget-minimized-button";
import { motion, useCycle } from "motion/react";

export function UploadWidget() {
    const [ isWidgetOpen, toggleWidgetOpen ] = useCycle(false, true)

    return (
        <Collapsible.Root onOpenChange={() => toggleWidgetOpen()}>
            <motion.div 
                className="bg-zinc-900 overflow-hidden max-w-90 rounded-xl shadow-shape"
                animate={isWidgetOpen ? 'open' : 'closed'}
                variants={{
                    closed: {
                        width: 'max-content',
                        height: 44,
                        transition: {
                            type: 'inertia'
                        }
                    },
                    open: {
                        width: 360,
                        height: 'auto',
                        transition: {
                            duration: 0.2
                        }
                    }   
                }}
                >
                {!isWidgetOpen && <UploadWidgetMinimizedButton />}

                <Collapsible.Content>
                    <UploadWidgetHeader></UploadWidgetHeader>

                    <div className="flex flex-col gap-4 py-3">
                        <UploadWidgetDropzone />
                        <div className="h-px bg-zinc-800 border-t border-black/50 box-content"></div>
                        <UploadWidgetUploadList />
                    </div>
                </Collapsible.Content>
            </motion.div>  
        </Collapsible.Root>
    )
}