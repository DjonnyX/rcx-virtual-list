import { IRect } from "../types";
import { Id } from "../types/id";
import { IVirtualListItem } from "./item.model";
import { IRenderVirtualListItemConfig } from "./render-item-config.model";

/**
 * List screen element model
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/render-item.model.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export interface IRenderVirtualListItem<E = any> {
    /**
     * Element index.
     */
    index: number;
    /**
     * Unique identifier of the element.
     */
    id: Id;
    /**
     * Element metrics.
     */
    measures: IRect & {
        /**
         * Delta is calculated for Snapping Method.ADVANCED
         */
        delta: number;
    };
    /**
     * Element data.
     */
    data: IVirtualListItem<E>;
    /**
     * Object with configuration parameters for IRenderVirtualListItem.
     */
    config: IRenderVirtualListItemConfig;
};
