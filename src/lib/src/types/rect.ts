import { ISize } from "./size";

/**
 * Rectangular area interface
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/types/rect.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export interface IRect extends ISize {
    /**
     * X coordinate.
     */
    x: number;
    /**
     * Y coordinate.
     */
    y: number;
}