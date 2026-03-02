"use client"

import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Separator } from "../ui/separator"
import { renderTemplate } from "@/utils/notifications"
import DOMPurify from "dompurify";

interface NotificationDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    notification?: any
}

function NotificationDrawer(props: NotificationDrawerProps) {
    const rawTemplateHtml = renderTemplate(props.notification?.template?.content || "", props.notification?.data || {});
    const safeTemplateHtml = DOMPurify.sanitize(rawTemplateHtml);

    return (
        <Drawer open={props.open} onOpenChange={props.onOpenChange} direction="right">
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>{props.notification?.title}</DrawerTitle>
                        <DrawerDescription>{props.notification?.message}</DrawerDescription>
                    </DrawerHeader>
                    <Separator />
                    <div className="px-3 py-2">
                        {safeTemplateHtml && (
                            <div dangerouslySetInnerHTML={{ __html: safeTemplateHtml }} />
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

export default NotificationDrawer
