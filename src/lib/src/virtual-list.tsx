import React, { createRef, forwardRef, RefObject, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
    IScrollEvent, IVirtualListCollection, IVirtualListItem, IVirtualListStickyMap, IVirtualListItemMethods,
    VirtualListItemRenderer, IVirtualListMethods,
} from './models';
import {
    BEHAVIOR_AUTO, BEHAVIOR_INSTANT, CLASS_LIST_HORIZONTAL, CLASS_LIST_VERTICAL, DEFAULT_DIRECTION, DEFAULT_DYNAMIC_SIZE,
    DEFAULT_ENABLED_BUFFER_OPTIMIZATION, DEFAULT_ITEM_SIZE, DEFAULT_ITEMS_OFFSET, DEFAULT_LIST_SIZE, DEFAULT_SNAP, HEIGHT_PROP_NAME,
    LEFT_PROP_NAME, MAX_SCROLL_TO_ITERATIONS, PX, SCROLL, SCROLL_END, TOP_PROP_NAME, TRACK_BY_PROPERTY_NAME, WIDTH_PROP_NAME,
} from './const';
import { isDirection, ScrollEvent, toggleClassName, TrackBox } from './utils';
import { Direction, Directions } from './enums';
import { VirtualListItem } from './components';
import { IGetItemPositionOptions, IUpdateCollectionOptions, TRACK_BOX_CHANGE_EVENT_NAME } from './utils/trackBox';
import { IRenderVirtualListCollection } from './models/render-collection.model';
import { useDebounce } from './utils/debounce';
import { Id } from './types/id';
import { ISize } from './types/size';

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

/**
 * Virtual list component.
 * Maximum performance for extremely large lists.
 * It is based on algorithms for virtualization of screen objects.
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/ng-virtual-list.component.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
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
    const _isStopJumpingScroll = useRef<boolean>(false);
    const _displayComponents = useRef<Array<React.RefObject<IVirtualListItemMethods | null>>>([]);
    const [_displayComponentsList, _setDisplayComponentsList] = useState<Array<React.RefObject<IVirtualListItemMethods | null>>>([]);
    const [_bounds, _setBounds] = useState<ISize | null>(null);
    const [_scrollSize, _setScrollSize] = useState<number>(0);
    const _resizeObserver = useRef<ResizeObserver | null>(null);
    const [_initialized, _setInitialized] = useState<boolean>(false);
    const [_cacheVersion, _setCacheVersion] = useState<number>(-1);

    const displayObjects = useMemo(() => {
        return _displayComponentsList.map((ref, index) => <VirtualListItem ref={ref} key={String(index)} />);
    }, [_displayComponentsList]);

    const getIsVertical = useCallback((d?: Direction) => {
        const dir = d || direction;
        return isDirection(dir, Directions.VERTICAL);
    }, [direction]);

    const _isVertical = useRef<boolean>(getIsVertical());
    const [_componentsResizeObserver] = useState<ResizeObserver>(new ResizeObserver(() => {
        _trackBox.current.changes();
    }));
    const _scrollToRepeatExecutionTimeout = useRef<any>(undefined);

    const _onTrackBoxChangeHandler = useRef((v: number) => {
        _setCacheVersion(v);
    });

    const mountedDisplayObjects = useMemo(() => {
        return displayObjects.length;
    }, [displayObjects]);

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

    const listenCacheChangesIfNeed = useRef((value: boolean) => {
        if (value) {
            if (!_trackBox.current.hasEventListener(TRACK_BOX_CHANGE_EVENT_NAME, _onTrackBoxChangeHandler.current)) {
                _trackBox.current.addEventListener(TRACK_BOX_CHANGE_EVENT_NAME, _onTrackBoxChangeHandler.current);
            }
        } else {
            if (_trackBox.current.hasEventListener(TRACK_BOX_CHANGE_EVENT_NAME, _onTrackBoxChangeHandler.current)) {
                _trackBox.current.removeEventListener(TRACK_BOX_CHANGE_EVENT_NAME, _onTrackBoxChangeHandler.current);
            }
        }
    });

    useEffect(() => {
        listenCacheChangesIfNeed.current(dynamicSize);
    }, [dynamicSize, listenCacheChangesIfNeed]);

    const _onResizeHandler = useRef(() => {
        const b = $containerRef?.current?.getBoundingClientRect();
        if (b) {
            const { width, height } = b;
            _setBounds({ width, height });
        } else {
            _setBounds({ width: DEFAULT_LIST_SIZE, height: DEFAULT_LIST_SIZE });
        }
    });

    const clearScrollToRepeatExecutionTimeout = useRef(() => {
        clearTimeout(_scrollToRepeatExecutionTimeout.current);
    });

    const _onScrollHandler = useRef((e?: Event) => {
        clearScrollToRepeatExecutionTimeout.current();

        const container = $containerRef?.current;
        if (container) {
            const scrollSize = (_isVertical.current ? container.scrollTop : container.scrollLeft);
            _setScrollSize(scrollSize);
        }
    });

    const debouncedStopJumpingScroll = useDebounce(() => {
        _isStopJumpingScroll.current = false;
    }, 250);

    const _onScrollEndHandler = useRef((e?: Event) => {
        debouncedStopJumpingScroll.execute();

        clearScrollToRepeatExecutionTimeout.current();

        const container = $containerRef?.current;
        if (container) {
            container.removeEventListener(SCROLL_END, _onScrollEndHandler.current);
        }
    });

    const _onContainerScrollHandler = useRef((e: Event) => {
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
    });

    const _onContainerScrollEndHandler = useRef((e: Event) => {
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
    });

    useEffect(() => {
        _onResizeHandler.current();
    }, []);

    useEffect(() => {
        if ($containerRef && $containerRef.current) {
            $containerRef.current.addEventListener(SCROLL, _onContainerScrollHandler.current);
            $containerRef.current.addEventListener(SCROLL_END, _onContainerScrollEndHandler.current);

            $containerRef.current.addEventListener(SCROLL, _onScrollHandler.current);

            if (_resizeObserver && !_resizeObserver.current) {
                _resizeObserver.current = new ResizeObserver(_onResizeHandler.current);
            }
            if (_resizeObserver && _resizeObserver.current) {
                _resizeObserver.current.observe($containerRef.current);
            }
        }

        return () => {
            if ($containerRef && $containerRef.current) {
                $containerRef.current.removeEventListener(SCROLL, _onContainerScrollHandler.current);
                $containerRef.current.removeEventListener(SCROLL_END, _onContainerScrollEndHandler.current);

                $containerRef.current.removeEventListener(SCROLL, _onScrollHandler.current);

                if (_resizeObserver.current) {
                    _resizeObserver.current.disconnect();
                }
            }
        }
    }, [$containerRef, _resizeObserver, _onResizeHandler, _onScrollHandler, _onContainerScrollHandler, _onContainerScrollEndHandler]);

    const debouncedResetCollection = useDebounce((_trackBox: RefObject<TrackBox>, items: IVirtualListCollection | undefined, itemSize: number) => {
        _trackBox.current.resetCollection(items, itemSize);
    });

    useEffect(() => {
        debouncedResetCollection.execute(_trackBox, items, itemSize);
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
    }, [_trackBox, _displayComponents, itemRenderer]);

    const _resizeObserveQueue = useRef<Array<React.RefObject<IVirtualListItemMethods | null>>>([]);

    const executeResizeObserverQueue = useCallback(() => {
        let isChanged = false;
        const queue = _resizeObserveQueue.current, newQueue: Array<RefObject<IVirtualListItemMethods | null>> = [];
        for (let l = queue.length, ei = l - 1, i = ei; i >= 0; i--) {
            const ref = queue[i], el = ref.current?.getElement();
            if (el) {
                isChanged = true;
                _resizeObserver.current?.observe(el);
                _resizeObserveQueue.current.slice(i, 1);
                continue;
            }

            newQueue.push(ref);
        }

        if (isChanged) {
            _setCacheVersion(v => v - 1);
        }

        _resizeObserveQueue.current = newQueue;
    }, [_resizeObserver, _resizeObserveQueue, _setCacheVersion]);

    const waitToResizeObserve = useRef((ref: React.RefObject<IVirtualListItemMethods | null>) => {
        _resizeObserveQueue.current.push(ref);
    });

    useEffect(() => {
        if (mountedDisplayObjects) {
            executeResizeObserverQueue();
        }
    }, [mountedDisplayObjects, executeResizeObserverQueue]);

    const createDisplayComponentsIfNeed = useCallback((displayItems: IRenderVirtualListCollection | null) => {
        if (!displayItems || !$listRef) {
            _trackBox.current.setDisplayObjectIndexMapById({});
            return;
        }

        _trackBox.current.items = displayItems;

        let isChanged = false;

        const _listContainerRef = $listRef,
            components = _displayComponents.current;

        while (components.length < displayItems.length) {
            if (_listContainerRef) {
                isChanged = true;

                const ref = createRef<IVirtualListItemMethods>();

                components.push(ref);

                waitToResizeObserve.current(ref);
            }
        }

        if (isChanged) {
            _setDisplayComponentsList([...components]);
        }

        resetRenderers();
    }, [$listRef, _trackBox, _displayComponents, resetRenderers, waitToResizeObserve]);

    /**
     * Tracking by id
     */
    const tracking = useCallback(() => {
        _trackBox.current.track();
    }, [_trackBox]);

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

    const scrollToExecutor = useCallback((id: Id, behavior: ScrollBehavior, iteration: number = 0, isLastIteration = false) => {
        if (!_bounds || !items || !items.length) {
            return;
        }

        const container = $containerRef;
        if (container) {
            clearScrollToRepeatExecutionTimeout.current();
            container.current?.removeEventListener(SCROLL_END, _onScrollEndHandler.current);

            if (dynamicSize) {
                if (container && container.current) {
                    container.current.removeEventListener(SCROLL, _onScrollHandler.current);
                }

                const { width, height } = _bounds, isVertical = _isVertical.current, delta = _trackBox.current.delta,
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

                    const _scrollSize = _trackBox.current.getItemPosition(id, stickyMap, { ...opts, scrollSize: actualScrollSize, fromItemId: id }),
                        notChanged = actualScrollSize === _scrollSize;

                    if (!notChanged || iteration < MAX_SCROLL_TO_ITERATIONS) {
                        clearScrollToRepeatExecutionTimeout.current();
                        _scrollToRepeatExecutionTimeout.current = setTimeout(() => {
                            scrollToExecutor(id, BEHAVIOR_INSTANT as ScrollBehavior, iteration + 1, notChanged);
                        });
                    } else {
                        _setScrollSize(actualScrollSize);

                        container.current?.addEventListener(SCROLL, _onScrollHandler.current);
                    }
                }

                container.current?.scrollTo(params);

                _setScrollSize(scrollSize);
            } else {
                const isVertical = _isVertical.current,
                    _scrollSize = (isVertical ? container.current?.scrollTop ?? 0 : container.current?.scrollLeft ?? 0),
                    index = items.findIndex(item => item.id === id), scrollSize = index * itemSize;

                if (_scrollSize !== scrollSize) {
                    _isStopJumpingScroll.current = true;
                    container.current?.addEventListener('scroll', _onScrollEndHandler.current);
                }
                const params: ScrollToOptions = { [_isVertical.current ? TOP_PROP_NAME : LEFT_PROP_NAME]: scrollSize, behavior };
                container.current?.scrollTo(params);
            }
        }
    }, [$containerRef, items, dynamicSize, itemSize, itemsOffset, stickyMap, snap, enabledBufferOptimization, _trackBox, _bounds, _isVertical,
        _onScrollHandler, resetBoundsSize, createDisplayComponentsIfNeed, tracking, clearScrollToRepeatExecutionTimeout,
    ]);

    /**
     * The method scrolls the list to the element with the given id and returns the value of the scrolled area.
     * Behavior accepts the values ​​"auto", "instant" and "smooth".
     */
    const scrollTo = useCallback((id: Id, behavior: ScrollBehavior = BEHAVIOR_AUTO as ScrollBehavior) => {
        scrollToExecutor(id, behavior);
    }, [scrollToExecutor]);

    /**
     * Scrolls the scroll area to the desired element with the specified ID.
     */
    const scrollToEnd = useCallback((behavior: ScrollBehavior = BEHAVIOR_INSTANT as ScrollBehavior) => {
        const latItem = items?.[items.length > 0 ? items.length - 1 : 0];
        if (latItem) {
            scrollTo(latItem.id, behavior);
        }
    }, [items, scrollTo]);

    useEffect(() => {
        if (_initialized) {
            resetRenderers(itemRenderer);
        }
    }, [_initialized, itemRenderer, resetRenderers]);

    useEffect(() => {
        if (_initialized && _bounds && items) {
            const { width, height } = _bounds, scrollSize = (_isVertical.current ? $containerRef?.current?.scrollTop ?? 0 : $containerRef?.current?.scrollLeft) ?? 0;
            let actualScrollSize = scrollSize;
            const opts: IUpdateCollectionOptions<IVirtualListItem, IVirtualListCollection> = {
                bounds: { width, height }, dynamicSize, isVertical, itemSize,
                itemsOffset, scrollSize: actualScrollSize, snap, enabledBufferOptimization,
            };
            const { displayItems, totalSize } = _trackBox.current.updateCollection(items, stickyMap, opts);

            resetBoundsSize(isVertical, totalSize);

            createDisplayComponentsIfNeed(displayItems);

            tracking();

            if (!_isStopJumpingScroll.current) {
                const container = $containerRef;

                if (container) {
                    const delta = _trackBox.current.delta;
                    actualScrollSize = scrollSize + delta;
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
        }
    }, [mountedDisplayObjects, $containerRef, _bounds, items, stickyMap, _scrollSize, itemSize, _trackBox,
        itemsOffset, snap, isVertical, dynamicSize, enabledBufferOptimization, _cacheVersion,
        _isStopJumpingScroll.current, resetBoundsSize, createDisplayComponentsIfNeed, tracking,
    ]);

    useEffect(() => {
        return () => {
            if (debouncedResetCollection) {
                debouncedResetCollection.dispose();
            }

            if (debouncedStopJumpingScroll) {
                debouncedStopJumpingScroll.dispose();
            }

            if (clearScrollToRepeatExecutionTimeout) {
                clearScrollToRepeatExecutionTimeout.current();
            }

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
                {displayObjects}
            </ul>
        </div>
    </div>
});