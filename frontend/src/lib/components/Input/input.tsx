import React from "react";

import { InputUnstyled, InputUnstyledProps } from "@mui/base";

import { BaseComponent } from "../_BaseComponent";
import { resolveClassNames } from "../_utils/resolveClassNames";

export type InputProps = InputUnstyledProps & {
    wrapperStyle?: React.CSSProperties;
};

export const Input = React.forwardRef((props: InputProps, ref: React.ForwardedRef<HTMLInputElement>) => {
    const { startAdornment, endAdornment, wrapperStyle, ...other } = props;

    const internalRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(
        props.inputRef,
        () => internalRef.current
    );

    const handleAdornmentClick = React.useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (internalRef.current) {
            internalRef.current.focus();
            internalRef.current.getElementsByTagName("input")[0].focus();
        }
        event.stopPropagation();
    }, []);

    return (
        <BaseComponent disabled={props.disabled}>
            <div
                ref={ref}
                className={resolveClassNames(
                    "flex",
                    "gap-2",
                    "bg-white",
                    "border",
                    "border-gray-300",
                    "rounded",
                    "shadow-sm",
                    "focus:border-indigo-500",
                    "w-full",
                    "sm:text-sm",
                    "p-2",
                    "outline-none",
                    "cursor-text",
                    {
                        "border-red-300": props.error,
                        "border-2": props.error,
                    }
                )}
                style={wrapperStyle}
            >
                {startAdornment && (
                    <div className="flex items-center" onClick={handleAdornmentClick}>
                        {startAdornment}
                    </div>
                )}
                <InputUnstyled
                    {...other}
                    ref={internalRef}
                    slotProps={{
                        root: {
                            className: "grow",
                        },
                        input: {
                            className:
                                "h-full focus:border-indigo-500 block w-full sm:text-sm border-gray-300 outline-none",
                        },
                    }}
                />
                {endAdornment && (
                    <div className="flex items-center" onClick={handleAdornmentClick}>
                        {endAdornment}
                    </div>
                )}
            </div>
        </BaseComponent>
    );
});

Input.displayName = "Input";
