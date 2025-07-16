import { Direction, Directions } from "../enums";

const HORIZONTAL_ALIASES = [Directions.HORIZONTAL, 'horizontal'],
    VERTICAL_ALIASES = [Directions.VERTICAL, 'vertical'];

/**
 * Determines the axis membership of a virtual list
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/utils/isDirection.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export const isDirection = (src: Direction, expected: Direction): boolean => {
    if (HORIZONTAL_ALIASES.includes(expected)) {
        return HORIZONTAL_ALIASES.includes(src);
    }
    return VERTICAL_ALIASES.includes(src);
}