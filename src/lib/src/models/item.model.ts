import { Id } from "../types/id";

/**
 * Virtual list element model
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/item.model.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export type IVirtualListItem<E = Object> = E & {
    /**
     * Unique identifier of the element.
     */
    id: Id;
    [x: string]: any;
};
