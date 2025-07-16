import React, { useRef } from "react";

/**
 * Simple debounce function.
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/utils/debounce.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export const debounce = (cb: (...args: Array<any>) => void, debounceTime: number = 0) => {
    let timeout: any;
    const dispose = () => {
        if (timeout !== undefined) {
            clearTimeout(timeout);
        }
    }
    const execute = (...args: Array<any>) => {
        dispose();

        timeout = setTimeout(() => {
            cb(...args);
        }, debounceTime);
    };
    return {
        /**
         *  Call handling method
         */
        execute,
        /**
         * Method of destroying handlers
         */
        dispose,
    };
};

export const useDebounce = (cb: (...args: Array<any>) => void, debounceTime: number = 0) => {
    const timeout = useRef<any>(null);

    const dispose = useRef(() => {
        if (timeout !== undefined) {
            clearTimeout(timeout.current);
        }
    });
    const execute = useRef((...args: Array<any>) => {
        dispose.current();

        timeout.current = setTimeout(() => {
            cb(...args);
        }, debounceTime);
    });
    return {
        /**
         *  Call handling method
         */
        execute: execute.current,
        /**
         * Method of destroying handlers
         */
        dispose: dispose.current,
    };
}
