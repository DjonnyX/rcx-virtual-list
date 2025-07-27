import { IVirtualListItem } from "./item.model";

/**
 * Virtual list elements collection interface
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/collection.model.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export interface IVirtualListCollection<E = Object> extends Array<IVirtualListItem<E>> { };