import React from "react";
import ReactDOM from "react-dom";

import { getTextWidth } from "@framework/utils/textSize";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";

import { useElementBoundingRect } from "../../hooks/useElementBoundingRect";
import { IconButton } from "../IconButton";
import { Input } from "../Input";
import { Virtualization } from "../Virtualization";
import { BaseComponent, BaseComponentProps } from "../_BaseComponent";
import { withDefaults } from "../_utils/components";
import { resolveClassNames } from "../_utils/resolveClassNames";

export type DropdownOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

export type DropdownProps = {
    id?: string;
    wrapperId?: string;
    options: DropdownOption[];
    value?: string;
    onChange?: (value: string) => void;
    filter?: boolean;
    width?: string | number;
} & BaseComponentProps;

const defaultProps = {
    value: "",
    filter: false,
};

const minHeight = 200;
const optionHeight = 32;

type DropdownRect = {
    left?: number;
    top?: number;
    right?: number;
    width: number;
    height: number;
    minWidth: number;
};

const noMatchingOptionsText = "No matching options";
const noOptionsText = "No options";

export const Dropdown = withDefaults<DropdownProps>()(defaultProps, (props) => {
    const [dropdownVisible, setDropdownVisible] = React.useState<boolean>(false);
    const [dropdownRect, setDropdownRect] = React.useState<DropdownRect>({
        width: 0,
        minWidth: 0,
        height: 0,
    });
    const [filter, setFilter] = React.useState<string | null>(null);
    const [selection, setSelection] = React.useState<string | number>(props.value);
    const [selectionIndex, setSelectionIndex] = React.useState<number>(-1);
    const [filteredOptions, setFilteredOptions] = React.useState<DropdownOption[]>(props.options);
    const [optionIndexWithFocus, setOptionIndexWithFocus] = React.useState<number>(-1);
    const [startIndex, setStartIndex] = React.useState<number>(0);
    const [keyboardFocus, setKeyboardFocus] = React.useState<boolean>(false);

    const inputRef = React.useRef<HTMLInputElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const inputBoundingRect = useElementBoundingRect(inputRef);

    const setOptionIndexWithFocusToCurrentSelection = React.useCallback(() => {
        const index = filteredOptions.findIndex((option) => option.value === selection);
        setSelectionIndex(index);
        setOptionIndexWithFocus(index);
    }, [filteredOptions, selection]);

    React.useEffect(() => {
        setSelection(props.value);
    }, [props.value]);

    React.useEffect(() => {
        const handleMouseDown = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setDropdownVisible(false);
                setFilter(null);
                setFilteredOptions(props.options);
                setOptionIndexWithFocus(-1);
            }
        };

        document.addEventListener("mousedown", handleMouseDown);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, [props.options]);

    React.useEffect(() => {
        let longestOptionWidth = props.options.reduce((prev, current) => {
            const labelWidth = getTextWidth(current.label, document.body);
            if (labelWidth > prev) {
                return labelWidth;
            }
            return prev;
        }, 0);

        if (longestOptionWidth === 0) {
            if (props.options.length === 0 || filter === "") {
                longestOptionWidth = getTextWidth(noOptionsText, document.body);
            } else {
                longestOptionWidth = getTextWidth(noMatchingOptionsText, document.body);
            }
        }
        setDropdownRect((prev) => ({ ...prev, width: longestOptionWidth + 32 }));

        const newFilteredOptions = props.options.filter((option) => option.label.includes(filter || ""));
        setFilteredOptions(newFilteredOptions);
    }, [props.options, filter]);

    React.useEffect(() => {
        if (dropdownVisible) {
            const inputClientBoundingRect = inputRef.current?.getBoundingClientRect();
            const bodyClientBoundingRect = document.body.getBoundingClientRect();

            const height = Math.min(minHeight, Math.max(filteredOptions.length * optionHeight, optionHeight)) + 2;

            if (inputClientBoundingRect && bodyClientBoundingRect) {
                const newDropdownRect: DropdownRect = {
                    minWidth: inputBoundingRect.width,
                    width: dropdownRect.width,
                    height: height,
                };

                if (inputClientBoundingRect.y + inputBoundingRect.height + height > window.innerHeight) {
                    newDropdownRect.top = inputClientBoundingRect.y - minHeight;
                    newDropdownRect.height = Math.min(height, inputClientBoundingRect.y);
                } else {
                    newDropdownRect.top = inputClientBoundingRect.y + inputBoundingRect.height;
                    newDropdownRect.height = Math.min(
                        height,
                        window.innerHeight - inputClientBoundingRect.y - inputBoundingRect.height
                    );
                }
                if (inputClientBoundingRect.x + inputBoundingRect.width > window.innerWidth / 2) {
                    newDropdownRect.right = window.innerWidth - (inputClientBoundingRect.x + inputBoundingRect.width);
                } else {
                    newDropdownRect.left = inputClientBoundingRect.x;
                }

                setDropdownRect((prev) => ({ ...newDropdownRect, width: prev.width }));

                setStartIndex(
                    Math.max(
                        0,
                        Math.round(
                            (filteredOptions.findIndex((option) => option.value === selection) || 0) -
                                height / optionHeight / 2
                        )
                    )
                );
                setOptionIndexWithFocusToCurrentSelection();
            }
        }
    }, [
        inputBoundingRect,
        dropdownVisible,
        filteredOptions,
        selection,
        setOptionIndexWithFocusToCurrentSelection,
        setStartIndex,
    ]);

    const handleOptionClick = React.useCallback(
        (value: string) => {
            setSelection(value);
            setSelectionIndex(props.options.findIndex((option) => option.value === value));
            setDropdownVisible(false);
            setFilter(null);
            setFilteredOptions(props.options);
            if (props.onChange) {
                props.onChange(value);
            }
            setOptionIndexWithFocus(-1);
        },
        [props.onChange, selection, props.options]
    );

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (dropdownRef.current) {
                const currentStartIndex = Math.round(dropdownRef.current?.scrollTop / optionHeight);
                if (dropdownVisible) {
                    if (e.key === "ArrowUp") {
                        e.preventDefault();
                        const adjustedOptionIndexWithFocus =
                            optionIndexWithFocus === -1 ? selectionIndex : optionIndexWithFocus;
                        const newIndex = Math.max(0, adjustedOptionIndexWithFocus - 1);
                        setOptionIndexWithFocus(newIndex);
                        if (newIndex < currentStartIndex) {
                            setStartIndex(newIndex);
                        }
                        setKeyboardFocus(true);
                    }
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        const adjustedOptionIndexWithFocus =
                            optionIndexWithFocus === -1 ? selectionIndex : optionIndexWithFocus;
                        const newIndex = Math.min(filteredOptions.length - 1, adjustedOptionIndexWithFocus + 1);
                        setOptionIndexWithFocus(newIndex);
                        if (newIndex >= currentStartIndex + minHeight / optionHeight - 1) {
                            setStartIndex(Math.max(0, newIndex - minHeight / optionHeight + 1));
                        }
                        setKeyboardFocus(true);
                    }
                    if (e.key === "Enter") {
                        e.preventDefault();
                        const option = filteredOptions[keyboardFocus ? optionIndexWithFocus : selectionIndex];
                        if (option && !option.disabled) {
                            handleOptionClick(option.value);
                        }
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        selection,
        filteredOptions,
        dropdownVisible,
        startIndex,
        handleOptionClick,
        optionIndexWithFocus,
        selectionIndex,
        keyboardFocus,
    ]);

    const handleInputClick = React.useCallback(() => {
        setDropdownVisible(true);
    }, []);

    const handleInputChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setFilter(event.target.value);
            const newFilteredOptions = props.options.filter((option) => option.label.includes(event.target.value));
            setFilteredOptions(newFilteredOptions);
            setSelectionIndex(newFilteredOptions.findIndex((option) => option.value === selection));
        },
        [props.options, selection]
    );

    const handlePointerOver = React.useCallback((index: number) => {
        setOptionIndexWithFocus(index);
        setKeyboardFocus(false);
    }, []);

    const makeInputValue = () => {
        if (dropdownVisible && filter !== null) {
            return filter;
        }
        return props.options.find((el) => el.value === selection)?.label || "";
    };

    return (
        <BaseComponent disabled={props.disabled}>
            <div style={{ width: props.width }} id={props.wrapperId}>
                <Input
                    ref={inputRef}
                    id={props.id}
                    error={selection !== "" && props.options.find((option) => option.value === selection) === undefined}
                    onClick={() => handleInputClick()}
                    endAdornment={
                        <IconButton size="small" onClick={() => setDropdownVisible((prev) => !prev)}>
                            {dropdownVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        </IconButton>
                    }
                    onChange={handleInputChange}
                    value={makeInputValue()}
                />
                {dropdownVisible &&
                    ReactDOM.createPortal(
                        <div
                            className="absolute bg-white border border-gray-300 rounded-md shadow-md overflow-y-auto z-50 box-border"
                            style={{ ...dropdownRect }}
                            ref={dropdownRef}
                        >
                            {filteredOptions.length === 0 && (
                                <div className="p-1 flex items-center text-gray-400 select-none">
                                    {props.options.length === 0 || filter === ""
                                        ? noOptionsText
                                        : noMatchingOptionsText}
                                </div>
                            )}
                            <Virtualization
                                direction="vertical"
                                items={filteredOptions}
                                itemSize={optionHeight}
                                containerRef={dropdownRef}
                                startIndex={startIndex}
                                renderItem={(option, index) => (
                                    <div
                                        key={option.value}
                                        className={resolveClassNames(
                                            "flex",
                                            "items-center",
                                            "cursor-pointer",
                                            "select-none",
                                            "pl-1",
                                            "pr-1",
                                            {
                                                "bg-blue-600 text-white box-border hover:bg-blue-700":
                                                    selection === option.value,
                                                "bg-blue-100":
                                                    selection !== option.value && optionIndexWithFocus === index,
                                                "bg-blue-700":
                                                    selection === option.value && optionIndexWithFocus === index,
                                                "pointer-events-none": option.disabled,
                                                "text-gray-400": option.disabled,
                                            }
                                        )}
                                        onClick={() => {
                                            if (option.disabled) {
                                                return;
                                            }
                                            handleOptionClick(option.value);
                                        }}
                                        style={{ height: optionHeight }}
                                        onPointerMove={() => handlePointerOver(index)}
                                        title={option.label}
                                    >
                                        <span className="whitespace-nowrap text-ellipsis overflow-hidden min-w-0">
                                            {option.label}
                                        </span>
                                    </div>
                                )}
                            />
                        </div>,
                        document.body
                    )}
            </div>
        </BaseComponent>
    );
});

Dropdown.displayName = "Dropdown";
