import React, { createRef, forwardRef, ReactNode, useCallback, useImperativeHandle, useState } from 'react';
import { IVirtualListItem } from '../models';
import { IRenderVirtualListItem } from '../models/render-item.model';
import { IRenderVirtualListItemConfig } from '../models/render-item-config.model';
import { Id, ISize } from '../types';
import {
    DEFAULT_ZINDEX,
    HIDDEN_ZINDEX,
    POSITION_ABSOLUTE, POSITION_STICKY, PX, SIZE_100_PERSENT, SIZE_AUTO, TRANSLATE_3D, VISIBILITY_HIDDEN,
    VISIBILITY_VISIBLE, ZEROS_TRANSLATE_3D
} from '../const';

export type VirtualListItemRenderer = (data: { data: IVirtualListItem, config: IRenderVirtualListItemConfig }) => ReactNode;

export interface VirtualListItemRefMethods {
    getId: () => number;
    setData: (data: IRenderVirtualListItem | undefined) => void;
    setRenderer: (renderer: VirtualListItemRenderer) => void;
    getElement: () => HTMLDivElement | null;
    getBounds: () => ISize;
    getItemId: () => Id | undefined;
    show: () => void;
    hide: () => void;
}


export interface IVirtualListItemProps { }

let __nextId: number = 0;
export const getNextId = () => { return __nextId; }

const DEFAULT_ITEM_RENDERER_FACTORY = () => <></>;

/**
 * Virtual list item component
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/components/ng-virtual-list-item.component.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export const VirtualListItem = forwardRef<VirtualListItemRefMethods, IVirtualListItemProps>(({ }, forwardedRef) => {
    const $elementRef = createRef<HTMLDivElement>();
    const $listItemRef = createRef<HTMLLIElement>();
    const [itemRenderer, setItemRenderer] = useState<VirtualListItemRenderer>(() => DEFAULT_ITEM_RENDERER_FACTORY);
    const [_id] = useState(() => {
        return __nextId = __nextId === Number.MAX_SAFE_INTEGER ? 0 : __nextId + 1;
    });
    const [_data, _setData] = useState<IRenderVirtualListItem | undefined>();

    const setDataTransform = useCallback((data: IRenderVirtualListItem | undefined) => {
        const el = $elementRef.current;
        if (data && el) {
            const styles = el.style;
            styles.zIndex = String(data.config.sticky);
            if (data.config.snapped) {
                styles.transform = ZEROS_TRANSLATE_3D;
                styles.position = POSITION_STICKY;
            } else {
                styles.position = POSITION_ABSOLUTE;
                styles.transform = `${TRANSLATE_3D}(${data.config.isVertical ? 0 : data.measures.x}${PX}, ${data.config.isVertical ? data.measures.y : 0}${PX} , 0)`;
            }
            styles.height = data.config.isVertical ? data.config.dynamic ? SIZE_AUTO : `${data.measures.height}${PX}` : SIZE_100_PERSENT;
            styles.width = data.config.isVertical ? SIZE_100_PERSENT : data.config.dynamic ? SIZE_AUTO : `${data.measures.width}${PX}`;
        }
        return data;
    }, [$elementRef]);

    const show = useCallback(() => {
        const el = $elementRef.current;
        if (el) {
            const styles = el.style;
            if (styles.visibility === VISIBILITY_VISIBLE) {
                return;
            }

            styles.zIndex = String(_data?.config?.sticky ?? DEFAULT_ZINDEX);
            styles.visibility = VISIBILITY_VISIBLE;
        }
    }, [$elementRef]);

    const hide = useCallback(() => {
        const el = $elementRef.current;
        if (el) {
            const styles = el.style;
            if (styles.visibility === VISIBILITY_HIDDEN) {
                return;
            }

            styles.visibility = VISIBILITY_HIDDEN;
            styles.transform = ZEROS_TRANSLATE_3D;
            styles.zIndex = HIDDEN_ZINDEX;
        }
    }, [$elementRef]);

    useImperativeHandle(forwardedRef, () => ({
        getElement: () => {
            return $elementRef.current;
        },
        getId: () => {
            return _id;
        },
        setData: (data: IRenderVirtualListItem | undefined) => {
            _setData(setDataTransform(data));
        },
        setRenderer: (renderer: VirtualListItemRenderer) => {
            setItemRenderer(() => renderer);
        },
        getBounds: (): ISize => {
            const element = $elementRef.current,
                { width, height } = element?.getBoundingClientRect() ?? { width: 0, height: 0 };
            return { width, height };
        },
        getItemId: (): Id | undefined => {
            return _data?.id;
        },
        show: (): void => {
            show();
        },
        hide: (): void => {
            hide();
        },
    }));

    const classNames = useCallback((data: IRenderVirtualListItem, ...classes: Array<string>) => {
        const result = ['rcxvl__item-container', ...(classes ?? [])];
        if (data.config.snapped) {
            result.push('snapped');
        }
        if (data.config.snappedOut) {
            result.push('snapped-out');
        }
        return result.join(' ');
    }, []);

    return <div ref={$elementRef} className='rcxvl__item'>
        {
            _data &&
            <li ref={$listItemRef} className={classNames(_data)}>
                {
                    typeof itemRenderer !== undefined && itemRenderer({ data: _data.data || {}, config: _data.config })

                }
            </li>
        }
    </div>
});
