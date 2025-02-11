import React from "react";
import ReactDOM from "react-dom";

import { XMarkIcon } from "@heroicons/react/20/solid";
import { useElementSize } from "@lib/hooks/useElementSize";

import { resolveClassNames } from "../_utils/resolveClassNames";

export type DialogProps = {
    title?: string;
    children?: React.ReactNode;
    modal?: boolean;
    open?: boolean;
    onClose?: () => void;
    width?: string | number;
    height?: string | number;
    minWidth?: string | number;
    minHeight?: string | number;
    actions?: React.ReactNode;
};

export const Dialog: React.FC<DialogProps> = (props) => {
    const [open, setOpen] = React.useState(props.open ?? false);

    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const dialogRef = React.useRef<HTMLDivElement>(null);

    const dialogSize = useElementSize(dialogRef);

    React.useEffect(() => {
        setOpen(props.open ?? false);
    }, [props.open]);

    const handleClose = () => {
        setOpen(false);
        props.onClose?.();
    };

    const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== wrapperRef.current) {
            return;
        }
        handleClose();
    };

    return ReactDOM.createPortal(
        <div
            ref={wrapperRef}
            className={resolveClassNames("fixed", "inset-0", "w-full", "h-full", "z-50", {
                "pointer-events-none": !props.modal,
                "bg-slate-600": props.modal,
                "bg-opacity-50": props.modal,
                hidden: !open,
            })}
            onClick={handleBackgroundClick}
        >
            <div
                ref={dialogRef}
                className={resolveClassNames(
                    "fixed",
                    "left-1/2",
                    "top-1/2",
                    "border",
                    "rounded",
                    "bg-white",
                    "shadow",
                    "w-50",
                    "h-50",
                    "pointer-events-auto"
                )}
                style={{
                    marginLeft: -dialogSize.width / 2,
                    marginTop: -dialogSize.height / 2,
                    height: props.height,
                    width: props.width,
                    minWidth: props.minWidth,
                    minHeight: props.minHeight,
                }}
            >
                <div className="flex justify-between p-4 border-b shadow-inner">
                    <h2 className="text-slate-800 font-bold text-lg">{props.title}</h2>
                    <div
                        className="hover:text-slate-500 cursor-pointer ml-4"
                        onPointerDown={handleClose}
                        title="Close dialog"
                    >
                        <XMarkIcon width={24} />
                    </div>
                </div>
                <div className="p-4">{props.children}</div>
                {props.actions && <div className="flex justify-end mt-4 bg-slate-100 p-4">{props.actions}</div>}
            </div>
        </div>,
        document.body
    );
};
