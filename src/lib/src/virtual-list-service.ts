import { createContext } from "react";
import { EventEmitter } from './utils/eventEmitter';
import { IRenderVirtualListItem } from "./models/render-item.model";

export enum VirtualListServiceEvents {
    VIRTUAL_LIST_ITEM_CLICK_EVENT = 'item-click',
};

type onItemClickEvent = VirtualListServiceEvents.VIRTUAL_LIST_ITEM_CLICK_EVENT;

type onItemClickListener = <E = any>(item: IRenderVirtualListItem<E> | undefined) => void;

type TListeners = onItemClickListener;

type TEvents = onItemClickEvent;

export class VirtualListService extends EventEmitter<TEvents, TListeners> {
    constructor() {
        super();
    }

    itemClick(data: IRenderVirtualListItem | undefined) {
        this.dispatch(VirtualListServiceEvents.VIRTUAL_LIST_ITEM_CLICK_EVENT, data);
    }
}

export const VirtualListContext = createContext<VirtualListService | undefined>(undefined);
