// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function endsWith(val: string | number, searchString: string): boolean {
    return new RegExp(`${searchString}$`).test(`${val}`);
}

type Predicate<T> = (item: T, idx: number) => boolean;

/**
 * Gets the index of the first item that meets the predication.
 */
export const firstIndex = <T>(array: ReadonlyArray<T>, predicate: Predicate<T>) => {
    const len = array.length;

    for (let i = 0; i < len; i++) {
        if (predicate(array[i], i)) {
            return i;
        }
    }

    return -1;
};

/**
 * Gets the first item that meets the predication.
 */
export const first = <T>(array: ReadonlyArray<T>, predicate: Predicate<T>) => {
    const idx = firstIndex(array, predicate);
    return idx > -1 ? array[idx] : undefined;
};
