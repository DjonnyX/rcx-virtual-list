import { Id, ISize } from "../types";

/**
 * VirtualList method Interface
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/virtual-list-methods.model.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export interface IVirtualListMethods {
    /**
     * Returns the bounds of an element with a given id
     */
    getItemBounds: (id: Id) => ISize | undefined;
    /**
     * The method scrolls the list to the element with the given id and returns the value of the scrolled area.
     * Behavior accepts the values ​​"auto", "instant" and "smooth".
     */
    scrollTo: (id: Id, behavior?: ScrollBehavior) => void;
    /**
     * Scrolls the scroll area to the desired element with the specified ID.
     */
    scrollToEnd: (behavior?: ScrollBehavior) => void;
}