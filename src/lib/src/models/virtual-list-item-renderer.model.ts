import { ReactNode } from "react";
import { IVirtualListItem } from "./item.model";
import { IRenderVirtualListItemConfig } from "./render-item-config.model";

/**
 * Virtualized list element factory
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/virtual-list-item-renderer.model.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export type VirtualListItemRenderer = (data: { data: IVirtualListItem, config: IRenderVirtualListItemConfig }) => ReactNode;
