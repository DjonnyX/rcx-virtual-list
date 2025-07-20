import { SnappingMethods } from "./snapping-methods";
/**
 * Snapping method.
 * 'normal' - Normal group rendering.
 * 'advanced' - The group is rendered on a transparent background. List items below the group are not rendered.
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/enums/snapping-method.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export type SnappingMethod = SnappingMethods | 'normal' | 'advanced';