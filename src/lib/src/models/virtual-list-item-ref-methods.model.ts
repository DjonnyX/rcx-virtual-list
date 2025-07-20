import { Id, ISize } from "../types";
import { IRenderVirtualListItem } from "./render-item.model";
import { VirtualListItemRenderer } from "./virtual-list-item-renderer.model";

/**
 * VirtualListItem method Interface
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/virtual-list-item-ref-methods.model.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export interface IVirtualListItemMethods {
    getId: () => number;
    setData: (data: IRenderVirtualListItem | undefined) => void;
    getData: () => IRenderVirtualListItem | undefined;
    setRenderer: (renderer: VirtualListItemRenderer) => void;
    setRegular: (value: boolean) => void;
    setRegularLength: (length: string) => void;
    getElement: () => HTMLDivElement | null;
    getBounds: () => ISize;
    getItemId: () => Id | undefined;
    show: () => void;
    hide: () => void;
}