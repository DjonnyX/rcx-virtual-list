/**
 * Object with configuration parameters for IRenderVirtualListItem
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/render-item-config.model.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 * 
 */
export interface IRenderVirtualListItemConfig {
    /**
     * Indicates that the element is odd.
     */
    odd: boolean;
    /**
     * Indicates that the element is even.
     */
    even: boolean;
    /**
     * If greater than 0, the element will have a sticky position with the given zIndex.
     */
    sticky: number;
    /**
     * Specifies whether the element will snap.
     */
    snap: boolean;
    /**
     * Indicates that the element is snapped.
     */
    snapped: boolean;
    /**
     * Indicates that the element is being shifted by another snap element.
     */
    snappedOut: boolean;
    /**
     * Indicates that the element is a vertical list item.
     */
    isVertical: boolean;
    /**
     * Specifies that the element adapts to the size of its content.
     */
    dynamic: boolean;
    /**
     * Returns true if the snapping method is advanced
     */
    isSnappingMethodAdvanced: boolean;
    /**
     * z-index
     */
    zIndex: string;
}