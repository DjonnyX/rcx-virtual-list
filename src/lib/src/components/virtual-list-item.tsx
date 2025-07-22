import React, { createRef, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { IVirtualListItemMethods, VirtualListItemRenderer } from '../models';
import { IRenderVirtualListItem } from '../models/render-item.model';
import { Id, ISize } from '../types';
import {
    DEFAULT_ZINDEX, DISPLAY_BLOCK, DISPLAY_NONE, HIDDEN_ZINDEX, POSITION_ABSOLUTE, POSITION_STICKY, PX, SIZE_100_PERSENT, SIZE_AUTO,
    TRANSLATE_3D, VISIBILITY_HIDDEN, VISIBILITY_VISIBLE, ZEROS_TRANSLATE_3D,
} from '../const';

export interface IVirtualListItemProps {
    regular?: boolean;
    renderer?: VirtualListItemRenderer;
}

let __nextId: number = 0;
export const getNextId = () => { return __nextId; }

const DEFAULT_ITEM_RENDERER_FACTORY = () => <></>;

/**
 * Virtual list item component
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/components/ng-virtual-list-item.component.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export const VirtualListItem = forwardRef<IVirtualListItemMethods, IVirtualListItemProps>(({ regular = false, renderer = DEFAULT_ITEM_RENDERER_FACTORY }, forwardedRef) => {
    const $elementRef = createRef<HTMLDivElement>();
    const $listItemRef = createRef<HTMLLIElement>();
    const [itemRenderer, setItemRenderer] = useState<{ renderer: VirtualListItemRenderer }>({ renderer });
    const [_id] = useState(() => {
        return __nextId = __nextId === Number.MAX_SAFE_INTEGER ? 0 : __nextId + 1;
    });
    const [_data, _setData] = useState<IRenderVirtualListItem | undefined>();
    const [_regular, _setRegular] = useState<boolean>(regular);
    const [_regularLength, _setRegularLength] = useState<string>(SIZE_100_PERSENT);

    useEffect(() => {
        setItemRenderer({ renderer: renderer ?? DEFAULT_ITEM_RENDERER_FACTORY });
    }, [renderer]);

    const setDataTransform = useCallback((data?: IRenderVirtualListItem | undefined) => {
        const result = data ?? _data;
        // etc
        return result;
    }, [$elementRef, _data]);

    const update = useCallback((data?: IRenderVirtualListItem | undefined) => {
        const d = data ?? _data, el = $elementRef.current;
        if (d && el) {
            const styles = el.style;
            styles.zIndex = String(d.config.sticky);
            if (d.config.snapped) {
                styles.transform = ZEROS_TRANSLATE_3D;
                if (!d.config.isSnappingMethodAdvanced) {
                    styles.position = POSITION_STICKY;
                }
            } else {
                styles.position = POSITION_ABSOLUTE;
                if (_regular) {
                    styles.transform = `${TRANSLATE_3D}(${d.config.isVertical ? 0 : d.measures.delta}${PX}, ${d.config.isVertical ? d.measures.delta : 0}${PX} , 0)`;
                } else {
                    styles.transform = `${TRANSLATE_3D}(${d.config.isVertical ? 0 : d.measures.x}${PX}, ${d.config.isVertical ? d.measures.y : 0}${PX} , 0)`;
                }
            }
            styles.height = d.config.isVertical ? d.config.dynamic ? SIZE_AUTO : `${d.measures.height}${PX}` : _regular ? _regularLength : SIZE_100_PERSENT;
            styles.width = d.config.isVertical ? _regular ? _regularLength : SIZE_100_PERSENT : d.config.dynamic ? SIZE_AUTO : `${d.measures.width}${PX}`;
        }
    }, [$elementRef, _regular, _regularLength, _data])

    const show = useCallback(() => {
        const el = $elementRef.current;
        if (el) {
            const styles = el.style;
            if (_regular) {
                if (styles.display === DISPLAY_BLOCK) {
                    return;
                }

                styles.display = DISPLAY_BLOCK;
            } else {
                if (styles.visibility === VISIBILITY_VISIBLE) {
                    return;
                }

                styles.visibility = VISIBILITY_VISIBLE;
            }
            styles.zIndex = String(_data?.config?.sticky ?? DEFAULT_ZINDEX);
        }
    }, [$elementRef, _regular, _data]);

    const hide = useCallback(() => {
        const el = $elementRef.current;
        if (el) {
            const styles = el.style;
            if (_regular) {
                if (styles.display === DISPLAY_NONE) {
                    return;
                }

                styles.display = DISPLAY_NONE;
            } else {
                if (styles.visibility === VISIBILITY_HIDDEN) {
                    return;
                }

                styles.visibility = VISIBILITY_HIDDEN;
            }
            styles.transform = ZEROS_TRANSLATE_3D;
            styles.zIndex = HIDDEN_ZINDEX;
        }
    }, [$elementRef, _regular]);

    useImperativeHandle(forwardedRef, () => ({
        getElement: () => {
            return $elementRef.current;
        },
        getId: () => {
            return _id;
        },
        setData: (data: IRenderVirtualListItem | undefined) => {
            _setData(setDataTransform(data));
            update(data);
        },
        getData: (): IRenderVirtualListItem | undefined => {
            return _data;
        },
        setRegular: (value: boolean) => {
            _setRegular(value);
            update();
        },
        setRegularLength: (length: string) => {
            _setRegularLength(length);
            update();
        },
        setRenderer: (renderer: VirtualListItemRenderer) => {
            setItemRenderer({ renderer });
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
    }), [$elementRef, _data, _id, itemRenderer]);

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

    const content = (itemRenderer !== undefined || itemRenderer !== null) && <itemRenderer.renderer data={_data?.data!} config={_data?.config!} />

    return <div ref={$elementRef} className='rcxvl__item'>
        {
            _data &&
            <li ref={$listItemRef} className={classNames(_data)}>
                {content}
            </li>
        }
    </div>
});
