import { IRenderVirtualListItem } from "./render-item.model";

/**
 * Virtual list screen elements collection interface
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/render-collection.model.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export interface IRenderVirtualListCollection extends Array<IRenderVirtualListItem> { };