import React from "react";
import { IVirtualListItem } from "./item.model";
import { IRenderVirtualListItemConfig } from "./render-item-config.model";

interface IProps {
    data: IVirtualListItem;
    config: IRenderVirtualListItemConfig;
}

/**
 * Virtualized list element factory
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/virtual-list-item-renderer.model.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export type VirtualListItemRenderer = React.FC<IProps>;
