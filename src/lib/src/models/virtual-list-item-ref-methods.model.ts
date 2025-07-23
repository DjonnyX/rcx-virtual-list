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
    get id(): number;
    set data(data: IRenderVirtualListItem | null | undefined);
    get data(): IRenderVirtualListItem | null | undefined;
    set renderer(renderer: VirtualListItemRenderer);
    set regular(value: boolean);
    set regularLength(length: string);
    get element(): HTMLDivElement | null;
    get itemId(): Id | undefined;
    getBounds: () => ISize;
    show: () => void;
    hide: () => void;
}