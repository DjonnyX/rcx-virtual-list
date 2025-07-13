import React, { createRef, forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { IScrollEvent, IVirtualListCollection, IVirtualListItem, IVirtualListStickyMap } from './models';
import {
    BEHAVIOR_AUTO, BEHAVIOR_INSTANT, CLASS_LIST_HORIZONTAL, CLASS_LIST_VERTICAL,
    DEFAULT_DIRECTION, DEFAULT_DYNAMIC_SIZE, DEFAULT_ENABLED_BUFFER_OPTIMIZATION, DEFAULT_ITEM_SIZE, DEFAULT_ITEMS_OFFSET,
    DEFAULT_SNAP, HEIGHT_PROP_NAME, LEFT_PROP_NAME, MAX_SCROLL_TO_ITERATIONS, PX, SCROLL, SCROLL_END, TOP_PROP_NAME, TRACK_BY_PROPERTY_NAME,
    WIDTH_PROP_NAME,
} from './const';
import { isDirection, ScrollEvent, toggleClassName, TrackBox } from './utils';
import { Direction, Directions } from './enums';
import { VirtualListItem } from './components';
import { IGetItemPositionOptions, IUpdateCollectionOptions, TRACK_BOX_CHANGE_EVENT_NAME } from './utils/trackBox';
import { IRenderVirtualListCollection } from './models/render-collection.model';
import { VirtualListItemRefMethods, VirtualListItemRenderer } from './components/virtual-list-item';
import { Id } from './types/id';
import { ISize } from './types/size';

export interface IVirtualListMethods {
    /**
     * Returns the bounds of an element with a given id
     */
    getItemBounds: (id: Id) => ISize | undefined;
    /**
     * The method scrolls the list to the element with the given id and returns the value of the scrolled area.
     * Behavior accepts the values ​​"auto", "instant" and "smooth".
     */
    scrollTo: (id: Id, behavior?: ScrollBehavior) => void;
    /**
     * Scrolls the scroll area to the desired element with the specified ID.
     */
    scrollToEnd: (behavior?: ScrollBehavior) => void;
}

export interface IVirtualListProps {
    className?: string;
    direction?: Direction;
    dynamicSize?: boolean;
    enabledBufferOptimization?: boolean;
    itemRenderer: VirtualListItemRenderer;
    items: IVirtualListCollection | undefined;
    itemsOffset?: number;
    itemSize?: number;
    snap?: boolean;
    stickyMap?: IVirtualListStickyMap;
    trackBy?: string;
    onScroll?: (e: IScrollEvent) => void;
    onScrollEnd?: (e: IScrollEvent) => void;
}

let __nextId: number = 0;

export const VirtualList = forwardRef<IVirtualListMethods, IVirtualListProps>(({
    direction = DEFAULT_DIRECTION, dynamicSize = DEFAULT_DYNAMIC_SIZE, enabledBufferOptimization = DEFAULT_ENABLED_BUFFER_OPTIMIZATION,
    itemsOffset: _itemOffset = DEFAULT_ITEMS_OFFSET, itemRenderer, items, itemSize: _itemSize = DEFAULT_ITEM_SIZE, snap = DEFAULT_SNAP,
    stickyMap: _stickyMap = {}, trackBy = TRACK_BY_PROPERTY_NAME, className,
    onScroll, onScrollEnd,
}: IVirtualListProps, forwardedRef) => {
    const $elementRef = useRef<HTMLDivElement>(null);
    const $containerRef = useRef<HTMLDivElement>(null);
    const $listRef = useRef<HTMLUListElement>(null);
    const [_id] = useState<number>(() => {
        __nextId = __nextId + 1 === Number.MAX_SAFE_INTEGER ? 0 : __nextId + 1;
        return __nextId;
    });
    const _trackBox = useRef(new TrackBox(trackBy));
    const _displayComponents = useRef<Array<React.RefObject<VirtualListItemRefMethods | null>>>([]);
    const [_bounds, _setBounds] = useState<DOMRect | null>(null);
    const [_scrollSize, _setScrollSize] = useState<number>(0);
    const _resizeObserver = useRef<ResizeObserver | null>(null);
    const [_initialized, _setInitialized] = useState<boolean>(false);
    const [_cacheVersion, _setCacheVersion] = useState<number>(-1);

    const getIsVertical = useCallback((d?: Direction) => {
        const dir = d || direction;
        return isDirection(dir, Directions.VERTICAL);
    }, [direction]);

    const _isVertical = useRef<boolean>(getIsVertical());
    const [_componentsResizeObserver] = useState<ResizeObserver>(new ResizeObserver(() => {
        _trackBox.current.changes();
    }));
    const _scrollToRepeatExecutionTimeout = useRef<any>(undefined);

    const _onTrackBoxChangeHandler = useCallback((v: number) => {
        _setCacheVersion(v);
    }, []);

    useEffect(() => {
        _setInitialized(true);
    }, []);

    useEffect(() => {
        _trackBox.current.displayComponents = _displayComponents.current as any;
    }, [_trackBox, _displayComponents]);

    useEffect(() => {
        _trackBox.current.trackingPropertyName = trackBy;
    }, [_trackBox, trackBy]);

    const itemSize = useMemo(() => {
        if (_itemSize === undefined) {
            return DEFAULT_ITEM_SIZE;
        }
        const val = Number(_itemSize);
        return Number.isNaN(val) || val <= 0 ? DEFAULT_ITEM_SIZE : val;
    }, [_itemSize]);

    const itemsOffset = useMemo(() => {
        if (_itemOffset === undefined) {
            return DEFAULT_ITEMS_OFFSET;
        }
        const val = Number(_itemOffset);
        return Number.isNaN(val) || val <= 0 ? DEFAULT_ITEMS_OFFSET : val;
    }, [_itemOffset]);

    const stickyMap = useMemo(() => {
        return !_stickyMap ? {} : _stickyMap;
    }, [_stickyMap]);

    const isVertical = useMemo(() => {
        return getIsVertical(direction || DEFAULT_DIRECTION);
    }, [direction]);

    useEffect(() => {
        const el: HTMLElement | null = $elementRef.current;
        if (el) {
            toggleClassName(el, isVertical ? CLASS_LIST_VERTICAL : CLASS_LIST_HORIZONTAL, false);
        }

        _isVertical.current = isVertical;
    }, [isVertical]);

    const listenCacheChangesIfNeed = useCallback((value: boolean) => {
        if (value) {
            if (!_trackBox.current.hasEventListener(TRACK_BOX_CHANGE_EVENT_NAME, _onTrackBoxChangeHandler)) {
                _trackBox.current.addEventListener(TRACK_BOX_CHANGE_EVENT_NAME, _onTrackBoxChangeHandler);
            }
        } else {
            if (_trackBox.current.hasEventListener(TRACK_BOX_CHANGE_EVENT_NAME, _onTrackBoxChangeHandler)) {
                _trackBox.current.removeEventListener(TRACK_BOX_CHANGE_EVENT_NAME, _onTrackBoxChangeHandler);
            }
        }
    }, [_trackBox, _onTrackBoxChangeHandler]);

    useEffect(() => {
        listenCacheChangesIfNeed(dynamicSize);
    }, [dynamicSize, listenCacheChangesIfNeed]);

    const _onResizeHandler = useCallback(() => {
        _setBounds($containerRef?.current?.getBoundingClientRect() ?? null);
    }, [$containerRef]);

    const clearScrollToRepeatExecutionTimeout = useCallback(() => {
        clearTimeout(_scrollToRepeatExecutionTimeout.current);
    }, [_scrollToRepeatExecutionTimeout]);

    const _onScrollHandler = useCallback((e?: Event) => {
        clearScrollToRepeatExecutionTimeout();

        const container = $containerRef?.current;
        if (container) {
            const scrollSize = (_isVertical.current ? container.scrollTop : container.scrollLeft);

            _setScrollSize(scrollSize);
        }
    }, [$containerRef, _isVertical, clearScrollToRepeatExecutionTimeout]);

    const _onContainerScrollHandler = useCallback((e: Event) => {
        const containerEl = $containerRef, list = $listRef!.current;
        if (containerEl && containerEl.current && list) {
            const scrollSize = (_isVertical.current ? containerEl.current.scrollTop : containerEl.current.scrollLeft);
            _trackBox.current.deltaDirection = _scrollSize > scrollSize ? -1 : _scrollSize < scrollSize ? 1 : 0;
            if ($listRef!.current!) {

            }
            const event = new ScrollEvent({
                direction: _trackBox.current.scrollDirection, container: containerEl.current,
                list, delta: _trackBox.current.delta,
                scrollDelta: _trackBox.current.scrollDelta, isVertical: _isVertical.current,
            });

            if (onScroll !== undefined) {
                onScroll(event);
            }
        }
    }, [$containerRef, $listRef, _isVertical, _scrollSize, _trackBox, onScroll]);

    const _onContainerScrollEndHandler = useCallback((e: Event) => {
        const containerEl = $containerRef, list = $listRef!.current;
        if (containerEl && containerEl.current && list) {
            const scrollSize = (_isVertical ? containerEl.current.scrollTop : containerEl.current.scrollLeft);
            _trackBox.current.deltaDirection = _scrollSize > scrollSize ? -1 : 0;

            const event = new ScrollEvent({
                direction: _trackBox.current.scrollDirection, container: containerEl.current,
                list, delta: _trackBox.current.delta,
                scrollDelta: _trackBox.current.scrollDelta, isVertical: _isVertical.current,
            });


            if (onScrollEnd !== undefined) {
                onScrollEnd(event);
            }
        }
    }, [$containerRef, $listRef, _isVertical, _scrollSize, _trackBox, onScrollEnd]);

    useEffect(() => {
        if ($containerRef && $containerRef.current) {
            $containerRef.current.addEventListener(SCROLL, _onContainerScrollHandler);
            $containerRef.current.addEventListener(SCROLL_END, _onContainerScrollEndHandler);

            $containerRef.current.addEventListener(SCROLL, _onScrollHandler);

            _resizeObserver.current = new ResizeObserver(_onResizeHandler);
            _resizeObserver.current.observe($containerRef.current);
        }

        _onResizeHandler();

        return () => {
            if ($containerRef && $containerRef.current) {
                $containerRef.current.removeEventListener(SCROLL, _onContainerScrollHandler);
                $containerRef.current.removeEventListener(SCROLL_END, _onContainerScrollEndHandler);

                $containerRef.current.removeEventListener(SCROLL, _onScrollHandler);

                if (_resizeObserver.current) {
                    _resizeObserver.current.disconnect();
                }
            }
        }
    }, [$containerRef, _resizeObserver]);

    useEffect(() => {
        _trackBox.current.resetCollection(items, itemSize);
    }, [_trackBox, items, itemSize]);

    const resetRenderers = useCallback((renderer?: VirtualListItemRenderer) => {
        const doMap: { [id: number]: number } = {}, components = _displayComponents.current;
        for (let i = 0, l = components.length; i < l; i++) {
            const item = components[i], ref = item, component = ref.current;
            if (component) {
                const id = component.getId();
                component.setRenderer(renderer ?? itemRenderer);
                doMap[id] = i;
            }
        }

        _trackBox.current.setDisplayObjectIndexMapById(doMap);
    }, [_trackBox, _displayComponents]);

    const _resizeObserveQueue = useRef<Array<React.RefObject<VirtualListItemRefMethods | null>>>([]);

    const executeResizeObserverQueue = useCallback(() => {
        const queue = _resizeObserveQueue.current, newQueue = [];
        for (let l = queue.length, ei = l - 1, i = ei; i >= 0; i--) {
            const ref = queue[i], el = ref.current?.getElement();
            if (el) {
                _resizeObserver.current?.observe(el);
                _resizeObserveQueue.current.slice(i, 1);
                continue;
            }

            newQueue.push(ref);
        }
        _resizeObserveQueue.current = newQueue;
    }, [_resizeObserver, _resizeObserveQueue]);

    const waitToResizeObserve = useCallback((ref: React.RefObject<VirtualListItemRefMethods | null>) => {
        _resizeObserveQueue.current.push(ref);
    }, [_resizeObserveQueue, executeResizeObserverQueue]);

    useEffect(() => {
        executeResizeObserverQueue();
    });

    const createDisplayComponentsIfNeed = useCallback((displayItems: IRenderVirtualListCollection | null) => {
        if (!displayItems || !$listRef) {
            _trackBox.current.setDisplayObjectIndexMapById({});
            return;
        }

        _trackBox.current.items = displayItems;

        const _listContainerRef = $listRef;

        const maxLength = displayItems.length, components = _displayComponents.current;

        while (components.length < maxLength) {
            if (_listContainerRef) {
                const ref = createRef<VirtualListItemRefMethods>();

                components.push(ref);

                waitToResizeObserve(ref);
            }
        }

        resetRenderers();
    }, [$listRef, _trackBox, _displayComponents, resetRenderers, waitToResizeObserve]);

    /**
     * Tracking by id
     */
    const tracking = useCallback(() => {
        _trackBox.current.track();
    }, [_trackBox, _cacheVersion]);

    const resetBoundsSize = useCallback((isVertical: boolean, totalSize: number) => {
        const l = $listRef;
        if (l && l.current) {
            l.current.style[isVertical ? HEIGHT_PROP_NAME : WIDTH_PROP_NAME] = `${totalSize}${PX}`;
        }
    }, [$listRef]);

    /**
     * Returns the bounds of an element with a given id
     */
    const getItemBounds = useCallback((id: Id): ISize | undefined => {
        return _trackBox.current.getItemBounds(id);
    }, [_trackBox]);

    /**
     * The method scrolls the list to the element with the given id and returns the value of the scrolled area.
     * Behavior accepts the values ​​"auto", "instant" and "smooth".
     */
    const scrollTo = (id: Id, behavior: ScrollBehavior = BEHAVIOR_AUTO as ScrollBehavior) => {
        scrollToExecutor(id, behavior);
    };

    const scrollToExecutor = (id: Id, behavior: ScrollBehavior, iteration: number = 0, isLastIteration = false) => {
        if (!items || !items.length) {
            return;
        }

        const container = $containerRef;
        if (container) {
            clearScrollToRepeatExecutionTimeout();

            if (dynamicSize) {
                if (container && container.current) {
                    container.current.removeEventListener(SCROLL, _onScrollHandler);
                }

                const { width, height } = _bounds || { width: 0, height: 0 }, isVertical = _isVertical.current, delta = _trackBox.current.delta,
                    opts: IGetItemPositionOptions<IVirtualListItem, IVirtualListCollection> = {
                        bounds: { width, height }, collection: items, dynamicSize, isVertical, itemSize,
                        itemsOffset, scrollSize: (isVertical ? container.current?.scrollTop ?? 0 : container.current?.scrollLeft ?? 0) + delta,
                        snap, fromItemId: id, enabledBufferOptimization,
                    },
                    scrollSize = _trackBox.current.getItemPosition(id, stickyMap, opts),
                    params: ScrollToOptions = { [isVertical ? TOP_PROP_NAME : LEFT_PROP_NAME]: scrollSize, behavior };
                _trackBox.current.clearDelta();

                if (container) {
                    const { displayItems, totalSize } = _trackBox.current.updateCollection(items, stickyMap, {
                        ...opts, scrollSize, fromItemId: isLastIteration ? undefined : id,
                    }), delta = _trackBox.current.delta;

                    _trackBox.current.clearDelta();

                    let actualScrollSize = scrollSize + delta;

                    resetBoundsSize(isVertical, totalSize);

                    createDisplayComponentsIfNeed(displayItems);

                    tracking();

                    const _scrollSize = _trackBox.current.getItemPosition(id, stickyMap, { ...opts, scrollSize: actualScrollSize, fromItemId: id });

                    const notChanged = actualScrollSize === _scrollSize

                    if (!notChanged || iteration < MAX_SCROLL_TO_ITERATIONS) {
                        clearScrollToRepeatExecutionTimeout();
                        _scrollToRepeatExecutionTimeout.current = setTimeout(() => {
                            scrollToExecutor(id, BEHAVIOR_INSTANT as ScrollBehavior, iteration + 1, notChanged);
                        });
                    } else {
                        _setScrollSize(actualScrollSize);

                        container.current?.addEventListener(SCROLL, _onScrollHandler);
                    }
                }

                container.current?.scrollTo(params);

                _setScrollSize(scrollSize);
            } else {
                const index = items.findIndex(item => item.id === id), scrollSize = index * itemSize;
                const params: ScrollToOptions = { [_isVertical.current ? TOP_PROP_NAME : LEFT_PROP_NAME]: scrollSize, behavior };
                container.current?.scrollTo(params);
            }
        }
    };

    /**
     * Scrolls the scroll area to the desired element with the specified ID.
     */
    const scrollToEnd = (behavior: ScrollBehavior = BEHAVIOR_INSTANT as ScrollBehavior) => {
        const latItem = items?.[items.length > 0 ? items.length - 1 : 0];
        if (latItem) {
            scrollTo(latItem.id, behavior);
        }
    };

    useEffect(() => {
        if (_initialized && _bounds) {
            const { width, height } = _bounds as DOMRect;
            let actualScrollSize = (_isVertical.current ? $containerRef?.current?.scrollTop ?? 0 : $containerRef?.current?.scrollLeft) ?? 0;
            const opts: IUpdateCollectionOptions<IVirtualListItem, IVirtualListCollection> = {
                bounds: { width, height }, dynamicSize, isVertical, itemSize,
                itemsOffset, scrollSize: _scrollSize, snap, enabledBufferOptimization,
            };
            const { displayItems, totalSize } = _trackBox.current.updateCollection(items ?? [], stickyMap, {
                ...opts, scrollSize: actualScrollSize,
            });

            resetBoundsSize(isVertical, totalSize);

            createDisplayComponentsIfNeed(displayItems);

            tracking();

            const container = $containerRef;

            if (container) {
                const delta = _trackBox.current.delta;
                actualScrollSize = actualScrollSize + delta;

                _trackBox.current.clearDelta();

                if (_scrollSize !== actualScrollSize) {
                    const params: ScrollToOptions = {
                        [_isVertical.current ? TOP_PROP_NAME : LEFT_PROP_NAME]: actualScrollSize,
                        behavior: BEHAVIOR_INSTANT as ScrollBehavior
                    };

                    container.current?.scrollTo(params);
                }
            }
        }
    }, [_bounds, items, stickyMap, _scrollSize, itemSize,
        itemsOffset, snap, isVertical, dynamicSize, enabledBufferOptimization, _cacheVersion,
        resetBoundsSize, createDisplayComponentsIfNeed, tracking,
    ]);

    useEffect(() => {
        if (_initialized) {
            resetRenderers(itemRenderer);
        }
    }, [_initialized, itemRenderer]);

    useEffect(() => {
        return () => {
            clearScrollToRepeatExecutionTimeout();

            if (_resizeObserveQueue) {
                _resizeObserveQueue.current = [];
            }

            if (_trackBox && _trackBox.current) {
                _trackBox.current.dispose();
            }

            if (_componentsResizeObserver) {
                _componentsResizeObserver.disconnect();
            }

            if (_resizeObserver.current) {
                _resizeObserver.current.disconnect();
            }
        };
    }, []);

    useImperativeHandle(forwardedRef, () => ({
        /**
         * Returns the bounds of an element with a given id
         */
        getItemBounds: (id: Id): ISize | undefined => {
            return getItemBounds(id);
        },

        /**
         * The method scrolls the list to the element with the given id and returns the value of the scrolled area.
         * Behavior accepts the values ​​"auto", "instant" and "smooth".
         */
        scrollTo: (id: Id, behavior?: ScrollBehavior) => {
            return scrollTo(id, behavior);
        },

        /**
         * Scrolls the scroll area to the desired element with the specified ID.
         */
        scrollToEnd: (behavior?: ScrollBehavior) => {
            return scrollToEnd(behavior);
        },
    }));

    return <div ref={$elementRef} className={`rcxvl ${className}`}>
        <div ref={$containerRef} className="rcxvl__container rcxvl__scroller">
            <ul ref={$listRef} className="rcxvl__list">
                {_displayComponents.current.map((ref, index) => <VirtualListItem ref={ref} key={String(index)} />)}
            </ul>
        </div>
    </div>
});