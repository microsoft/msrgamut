// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

type DebounceOptions = Partial<{
    wait: number;
    immediate: boolean;
}>;

const debounceFunc = <T extends Function>(func: T, options?: DebounceOptions, thisArg?: any) => {
    const { wait = 250, immediate = false } = options || <DebounceOptions>{};
    let timer: number = null;

    // tslint:disable-next-line:no-function-expression
    const newFunc: Function = function (...args: any[]) {
        const invokeNow = immediate && timer === null;

        clearTimeout(timer);

        timer = window.setTimeout(() => {
            timer = null;
            if (!invokeNow) {
                func.apply(thisArg || this, args);
            }
        }, wait);

        if (invokeNow) {
            func.apply(thisArg || this, args);
        }
    };

    return <T>newFunc;
};

const debounceMethod = (options?: DebounceOptions) => {
    return (_: any, __: string, descriptor: TypedPropertyDescriptor<Function>) => {
        descriptor.value = debounceFunc(descriptor.value, options);
    };
};

export function debounce(...args: any[]) {
    return typeof args[0] === 'function' ? debounceFunc.apply(null, args) : debounceMethod.apply(null, args);
}
