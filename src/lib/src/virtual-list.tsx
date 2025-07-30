import React, {
    createRef, RefObject,
} from 'react';
import {
    IScrollEvent, IVirtualListCollection, IVirtualListItem, IVirtualListStickyMap, IVirtualListItemMethods,
    VirtualListItemRenderer,
} from './models';
import {
    BEHAVIOR_AUTO, BEHAVIOR_INSTANT, CLASS_LIST_HORIZONTAL, CLASS_LIST_VERTICAL, DEFAULT_BUFFER_SIZE, DEFAULT_DIRECTION, DEFAULT_DYNAMIC_SIZE,
    DEFAULT_ENABLED_BUFFER_OPTIMIZATION, DEFAULT_ITEM_SIZE, DEFAULT_LIST_SIZE, DEFAULT_MAX_BUFFER_SIZE, DEFAULT_SNAP, DEFAULT_SNAPPING_METHOD,
    HEIGHT_PROP_NAME, LEFT_PROP_NAME, MAX_SCROLL_TO_ITERATIONS, PX, SCROLL, SCROLL_END, TOP_PROP_NAME,
    TRACK_BY_PROPERTY_NAME, WIDTH_PROP_NAME,
} from './const';
import { debounce, isDirection, ScrollEvent, TrackBox } from './utils';
import { Direction, Directions, SnappingMethod } from './enums';
import { VirtualListItem } from './components';
import { IGetItemPositionOptions, IUpdateCollectionOptions, TRACK_BOX_CHANGE_EVENT_NAME } from './utils/trackBox';
import { IRenderVirtualListCollection } from './models/render-collection.model';
import { Id } from './types/id';
import { ISize } from './types/size';
import { FIREFOX_SCROLLBAR_OVERLAP_SIZE, IS_FIREFOX } from './utils/browser';
import { isSnappingMethodAdvenced } from './utils/snapping-method';

export interface IVirtualListProps {
    className?: string;
    /**
     * Determines the direction in which elements are placed. Default value is "vertical".
     */
    direction?: Direction;
    /**
     * If true then the items in the list can have different sizes and the itemSize property is ignored.
     * If false then the items in the list have a fixed size specified by the itemSize property. The default value is false.
     */
    dynamicSize?: boolean;
    /**
     * Experimental!
     * Enables buffer optimization.
     * Can only be used if items in the collection are not added or updated. Otherwise, artifacts in the form of twitching of the scroll area are possible.
     * Works only if the property dynamic = true
     */
    enabledBufferOptimization?: boolean;
    /**
     * Rendering element template.
     */
    itemRenderer: VirtualListItemRenderer;
    /**
     * Collection of list items.
     */
    items: IVirtualListCollection | undefined;
    /**
     * @deprecated "itemOffset" parameter is deprecated. Use "bufferSize" and "maxBufferSize".
     */
    itemsOffset?: number;
    /**
     * Number of elements outside the scope of visibility. Default value is 2.
     */
    bufferSize?: number;
    /**
     * Maximum number of elements outside the scope of visibility. Default value is 100.
     * If maxBufferSize is set to be greater than bufferSize, then adaptive buffer mode is enabled.
     * The greater the scroll size, the more elements are allocated for rendering.
     */
    maxBufferSize?: number;
    /**
     * If direction = 'vertical', then the height of a typical element. If direction = 'horizontal', then the width of a typical element.
     * Ignored if the dynamicSize property is true.
     */
    itemSize?: number;
    /**
     * Determines whether elements will snap. Default value is "true".
     */
    snap?: boolean;
    /**
     * Snapping method.
     * 'default' - Normal group rendering.
     * 'advanced' - The group is rendered on a transparent background. List items below the group are not rendered.
     */
    snappingMethod?: SnappingMethod;
    /**
     * Dictionary zIndex by id of the list element. If the value is not set or equal to 0,
     * then a simple element is displayed, if the value is greater than 0, then the sticky position mode is enabled for the element.
     */
    stickyMap?: IVirtualListStickyMap;
    /**
     * The name of the property by which tracking is performed
     */
    trackBy?: string;
    /**
     * Fires when the list has been scrolled.
     */
    onScroll?: (e: IScrollEvent) => void;
    /**
     * Fires when the list has completed scrolling.
     */
    onScrollEnd?: (e: IScrollEvent) => void;
}

interface IVirtualListState {
    cacheVersion: number;
    displayComponentsList: Array<React.RefObject<VirtualListItem | null>>;
    isVertical: boolean;
    scrollSize: number;
    bounds: ISize | null;
}

/**
 * Virtual list component.
 * Maximum performance for extremely large lists.
 * It is based on algorithms for virtualization of screen objects.
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/ng-virtual-list.component.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export class VirtualList extends React.Component<IVirtualListProps, IVirtualListState> {
    private static __nextId: number = 0;

    private _id: number = VirtualList.__nextId;
    /**
     * Readonly. Returns the unique identifier of the component.
     */
    get id() { return this._id; }

    private _$elementRef = createRef<HTMLDivElement>();

    private _$containerRef = createRef<HTMLDivElement>();

    private _$snappedRef = createRef<HTMLDivElement>();

    private _$listRef = createRef<HTMLUListElement>();

    private _itemsTransform = (v: IVirtualListCollection | null | undefined) => {
        this._trackBox.resetCollection(v, this.itemSize);
        return v;
    };

    private _items: IVirtualListCollection | null | undefined;

    /**
     * Collection of list items.
     */
    set items(v: IVirtualListCollection | null | undefined) {
        if (this._items !== v) {
            this._items = this._itemsTransform(v);
        }
    }
    get items() {
        return this._items;
    }

    private _snap: boolean = DEFAULT_SNAP;

    /**
     * Determines whether elements will snap. Default value is "true".
     */
    set snap(v: boolean) {
        if (this._snap !== v) {
            this._snap = v;
        }
    }
    get snap() {
        return this._snap;
    }

    private _enabledBufferOptimization: boolean = DEFAULT_ENABLED_BUFFER_OPTIMIZATION;

    /**
     * Experimental!
     * Enables buffer optimization.
     * Can only be used if items in the collection are not added or updated. Otherwise, artifacts in the form of twitching of the scroll area are possible.
     * Works only if the property dynamic = true
     */
    set enabledBufferOptimization(v: boolean) {
        if (this._enabledBufferOptimization !== v) {
            this._enabledBufferOptimization = v;
        }
    }
    get enabledBufferOptimization() {
        return this._enabledBufferOptimization;
    }

    private _itemRenderer!: VirtualListItemRenderer;

    /**
     * Rendering element template.
     */
    set itemRenderer(v: VirtualListItemRenderer) {
        if (this._itemRenderer !== v) {
            this._itemRenderer = v;

            if (this._initialized) {
                this.setState(v => ({
                    ...v,
                    itemRenderer: { renderer: this._itemRenderer }
                }));
            }
        }
    }
    get itemRenderer() {
        return this._itemRenderer;
    }

    private _stickyMap: IVirtualListStickyMap = {};

    /**
     * Dictionary zIndex by id of the list element. If the value is not set or equal to 0,
     * then a simple element is displayed, if the value is greater than 0, then the sticky position mode is enabled for the element.
     */
    set stickyMap(v: IVirtualListStickyMap) {
        if (this._stickyMap !== v) {
            this._stickyMap = v;
        }
    }
    get stickyMap() {
        return this._stickyMap;
    }

    private _itemSizeTransform = (v: number | undefined) => {
        if (v === undefined) {
            return DEFAULT_ITEM_SIZE;
        }
        const val = Number(v);
        return Number.isNaN(val) || val <= 0 ? DEFAULT_ITEM_SIZE : val;
    };


    private _itemSize: number = DEFAULT_ITEM_SIZE;

    /**
     * If direction = 'vertical', then the height of a typical element. If direction = 'horizontal', then the width of a typical element.
     * Ignored if the dynamicSize property is true.
     */
    set itemSize(v: number) {
        if (this._itemSize !== v) {
            this._itemSize = this._itemSizeTransform(v);
        }
    }
    get itemSize() {
        return this._itemSize;
    }

    private _dynamicSize: boolean = DEFAULT_DYNAMIC_SIZE;

    /**
     * If true then the items in the list can have different sizes and the itemSize property is ignored.
     * If false then the items in the list have a fixed size specified by the itemSize property. The default value is false.
     */
    set dynamicSize(v: boolean) {
        if (this._dynamicSize !== v) {
            this._dynamicSize = v;
            this.listenCacheChangesIfNeed(v);
        }
    }
    get dynamicSize() {
        return this._dynamicSize;
    }

    private _direction: Direction = DEFAULT_DIRECTION;

    /**
     * Determines the direction in which elements are placed. Default value is "vertical".
     */
    set direction(v: Direction) {
        if (this._direction !== v) {
            this._direction = v;
            this._isVertical = this.getIsVertical(v);
            if (this._initialized) {
                this.setState(v => ({
                    ...v,
                    isVertical: this._isVertical,
                }));
            }
        }
    }
    get direction() {
        return this._direction;
    }

    private _bufferSize: number = DEFAULT_BUFFER_SIZE;

    /**
     * Number of elements outside the scope of visibility. Default value is 2.
     */
    set bufferSize(v: number) {
        if (this._bufferSize !== v) {
            this._bufferSize = v;
        }
    }
    get bufferSize() {
        return this._bufferSize;
    }

    private _maxBufferSize: number = DEFAULT_MAX_BUFFER_SIZE;

    /**
     * Number of elements outside the scope of visibility. Default value is 2.
     */
    set maxBufferSize(v: number) {
        const bufferSize = this.bufferSize;
        if (v === undefined || v <= bufferSize) {
            this._maxBufferSize = bufferSize;
            return;
        }
        if (this._maxBufferSize !== v) {
            this._maxBufferSize = v;
        }
    }
    get maxBufferSize() {
        return this._maxBufferSize;
    }

    private _snappingMethod: SnappingMethod = DEFAULT_SNAPPING_METHOD;

    /**
     * Snapping method.
     * 'default' - Normal group rendering.
     * 'advanced' - The group is rendered on a transparent background. List items below the group are not rendered.
     */
    set snappingMethod(v: SnappingMethod) {
        if (this._snappingMethod !== v) {
            this._snappingMethod = v;
            this._isSnappingMethodAdvanced = this.getIsSnappingMethodAdvanced(v);
            this._trackBox.isSnappingMethodAdvanced = this._isSnappingMethodAdvanced;
        }
    }
    get snappingMethod() {
        return this._snappingMethod;
    }

    private _trackBy: string = TRACK_BY_PROPERTY_NAME;

    /**
     * The name of the property by which tracking is performed
     */
    set trackBy(v: string) {
        if (this._trackBy !== v) {
            this._trackBy = v;
            this._trackBox.trackingPropertyName = v;
        }
    }
    get trackBy() {
        return this._trackBy;
    }

    /**
     * Dictionary of element sizes by their id
     */
    private _trackBox = new TrackBox(this.trackBy);

    private _className: string | undefined;

    private _onScroll: ((e: IScrollEvent) => void) | undefined;

    private _onScrollEnd: ((e: IScrollEvent) => void) | undefined;

    private _displayComponents: Array<React.RefObject<VirtualListItem | null>> = [];

    private _snapedDisplayComponent = createRef<VirtualListItem | null>();

    private _displayComponentsList: Array<React.RefObject<VirtualListItem | null>> = [];
    protected set displayComponentsList(v: Array<React.RefObject<VirtualListItem | null>>) {
        if (this._displayComponentsList !== v) {
            this._displayComponentsList = v;
            if (this._initialized) {
                this.setState(v => ({
                    ...v,
                    displayComponentsList: this._displayComponentsList,
                }));
            }
        }
    }

    private _bounds: ISize | null = null;
    protected set bounds(v: ISize | null) {
        if (this._bounds !== v) {
            this._bounds = v;

            if (this._initialized) {
                this.setState(v => ({
                    ...v,
                    bounds: this._bounds,
                }));
            }
        }
    }
    protected get bounds() { return this._bounds; }

    private _scrollSize: number = 0;
    protected set scrollSize(v: number) {
        if (this._scrollSize !== v) {
            this._scrollSize = v;

            if (this._initialized) {
                this.setState(v => ({
                    ...v,
                    scrollSize: this._scrollSize,
                }));
            }
        }
    }
    protected get scrollSize() { return this._scrollSize; }

    private _cacheVersion: number = -1;
    protected set cacheVersion(v: number) {
        if (this._cacheVersion !== v) {
            this._cacheVersion = v;

            if (this._initialized) {
                this.setState(v => ({
                    ...v,
                    cacheVersion: this._cacheVersion,
                }));
            }
        }
    }
    protected get cacheVersion() { return this._cacheVersion; }

    private _resizeObserver: ResizeObserver | null = null;

    protected _isSnappingMethodAdvanced: boolean = this.getIsSnappingMethodAdvanced();

    protected _isVertical: boolean = this.getIsVertical();

    protected _initialized = false;

    private _onTrackBoxChangeHandler = (v: number) => {
        this.cacheVersion = v;
    }

    private _resizeSnappedComponentHandler = () => {
        const list = this._$listRef, container = this._$containerRef, snappedComponent = this._snapedDisplayComponent?.current;
        if (list && list.current && container && container.current && snappedComponent) {
            const isVertical = this._isVertical, listBounds = list.current.getBoundingClientRect(), listElement = list?.current,
                { width: lWidth, height: lHeight } = listElement?.getBoundingClientRect() ?? { width: 0, height: 0 },
                { width, height } = container.current?.getBoundingClientRect() ?? { width: 0, height: 0 },
                isScrollable = isVertical ? container.current.scrollHeight > 0 : container.current.scrollWidth > 0;

            let scrollBarSize = isVertical ? width - lWidth : height - lHeight, isScrollBarOverlap = true, overlapScrollBarSize = 0;
            if (scrollBarSize === 0 && isScrollable) {
                isScrollBarOverlap = true;
            }

            if (isScrollBarOverlap && IS_FIREFOX) {
                scrollBarSize = overlapScrollBarSize = FIREFOX_SCROLLBAR_OVERLAP_SIZE;
            }

            const element = snappedComponent.element;
            if (element) {
                element.style.clipPath =
                    `path("M 0 0 L 0 ${element.offsetHeight} L ${element.offsetWidth - overlapScrollBarSize} ${element.offsetHeight} L ${element.offsetWidth - overlapScrollBarSize} 0 Z")`;

                snappedComponent.regularLength = `${isVertical ? listBounds.width : listBounds.height}${PX}`;
                const { width: sWidth, height: sHeight } = snappedComponent.getBounds() ?? { width: 0, height: 0 },
                    containerElement = container.current;

                if (containerElement) {
                    let left: number, right: number, top: number, bottom: number;
                    if (isVertical) {
                        const delta = snappedComponent.data?.measures.delta ?? 0;
                        left = 0;
                        right = width - scrollBarSize;
                        top = sHeight;
                        bottom = height;
                        containerElement.style.clipPath =
                            `path("M 0 ${top + delta} L 0 ${height} L ${width} ${height} L ${width} 0 L ${right} 0 L ${right} ${top + delta} Z")`;
                    } else {
                        const delta = snappedComponent.data?.measures.delta ?? 0;
                        left = sWidth;
                        right = width;
                        top = 0;
                        bottom = height - scrollBarSize;
                        containerElement.style.clipPath =
                            `path("M ${left + delta} 0 L ${left + delta} ${bottom} L 0 ${bottom} L 0 ${height} L ${width} ${height} L ${width} 0 Z")`;
                    }
                }
            }
        }
    };

    private _observeComponentRenderersTimeout: number | undefined = undefined;

    private _scrollToRepeatExecutionTimeout: number | undefined = undefined;

    private _resizeSnappedObserver: ResizeObserver | null = null;

    private _componentsResizeObserver = new ResizeObserver(() => {
        this._trackBox.changes();
    });

    private _onResizeHandler = () => {
        const bounds = this._$containerRef.current?.getBoundingClientRect();
        if (bounds) {
            this.bounds = ({ width: bounds.width, height: bounds.height });
        } else {
            this.bounds = ({ width: DEFAULT_LIST_SIZE, height: DEFAULT_LIST_SIZE });
        }

        if (this._isSnappingMethodAdvanced) {
            this._resizeSnappedComponentHandler();
        }
    }

    private _onScrollHandler = (e?: Event) => {
        this.disposeScrollToRepeatExecutionTimeout();

        const container = this._$containerRef?.current;
        if (container) {
            const scrollSize = (this._isVertical ? container.scrollTop : container.scrollLeft),
                actualScrollSize = scrollSize;
            this.scrollSize = actualScrollSize;
        }
    }

    private _onScrollEndHandler = (e?: Event) => {
        this.disposeScrollToRepeatExecutionTimeout();

        const container = this._$containerRef?.current;
        if (container) {
            container.removeEventListener(SCROLL_END, this._onScrollEndHandler);
        }
    }

    private _onContainerScrollHandler = (e: Event) => {
        const container = this._$containerRef?.current, list = this._$listRef?.current;
        if (container && list) {
            const scrollSize = (this._isVertical ? container.scrollTop : container.scrollLeft);
            this._trackBox.deltaDirection = this._scrollSize > scrollSize ? -1 : this._scrollSize < scrollSize ? 1 : 0;
            const event = new ScrollEvent({
                direction: this._trackBox.scrollDirection, container: container,
                list, delta: this._trackBox.delta,
                scrollDelta: this._trackBox.scrollDelta, isVertical: this._isVertical,
            });

            if (this._onScroll !== undefined) {
                this._onScroll(event);
            }
        }
    }

    private _onContainerScrollEndHandler = (e: Event) => {
        const container = this._$containerRef?.current, list = this._$listRef?.current;
        if (container && list) {
            const scrollSize = (this._isVertical ? container.scrollTop : container.scrollLeft);
            this._trackBox.deltaDirection = this._scrollSize > scrollSize ? -1 : 0;

            const event = new ScrollEvent({
                direction: this._trackBox.scrollDirection, container: container,
                list, delta: this._trackBox.delta,
                scrollDelta: this._trackBox.scrollDelta, isVertical: this._isVertical,
            });

            if (this._onScrollEnd !== undefined) {
                this._onScrollEnd(event);
            }
        }
    }

    constructor(props: IVirtualListProps) {
        super(props);

        const {
            direction = DEFAULT_DIRECTION, dynamicSize = DEFAULT_DYNAMIC_SIZE, enabledBufferOptimization = DEFAULT_ENABLED_BUFFER_OPTIMIZATION,
            bufferSize = DEFAULT_BUFFER_SIZE, maxBufferSize = DEFAULT_MAX_BUFFER_SIZE, itemRenderer, items, itemSize = DEFAULT_ITEM_SIZE,
            snap = DEFAULT_SNAP, snappingMethod = DEFAULT_SNAPPING_METHOD, stickyMap = {}, trackBy = TRACK_BY_PROPERTY_NAME, className,
            onScroll, onScrollEnd,
        } = props;

        this.direction = direction;
        this.dynamicSize = dynamicSize;
        this.enabledBufferOptimization = enabledBufferOptimization;
        this.bufferSize = bufferSize;
        this.maxBufferSize = maxBufferSize;
        this.items = items;
        this.itemRenderer = itemRenderer;
        this.itemSize = itemSize;
        this.snap = snap;
        this.snappingMethod = snappingMethod;
        this.stickyMap = stickyMap;
        this.trackBy = trackBy;
        this._className = className;
        this._onScroll = onScroll;
        this._onScrollEnd = onScrollEnd;

        this.state = {
            cacheVersion: this._cacheVersion,
            displayComponentsList: this._displayComponentsList,
            isVertical: this._isVertical,
            scrollSize: this._scrollSize,
            bounds: this._bounds,
        };
    }

    private _t = Date.now();

    getSnapshotBeforeUpdate(prevProps: Readonly<IVirtualListProps>, prevState: Readonly<IVirtualListState>) {
        return null;
    }

    componentDidUpdate(prevProps: Readonly<IVirtualListProps>, prevState: Readonly<IVirtualListState>, snapshot?: any): void {
        // etc
    }

    shouldComponentUpdate(nextProps: Readonly<IVirtualListProps>, nextState: Readonly<IVirtualListState>, nextContext: any): boolean {
        let needToUpdate = false;
        if (nextProps.direction !== this._direction) {
            this.direction = nextProps.direction ?? DEFAULT_DIRECTION;
            needToUpdate = true;
        }

        if (nextProps.dynamicSize !== this._dynamicSize) {
            this.dynamicSize = nextProps.dynamicSize ?? DEFAULT_DYNAMIC_SIZE;
            needToUpdate = true;
        }

        if (nextProps.enabledBufferOptimization !== this._enabledBufferOptimization) {
            this.enabledBufferOptimization = nextProps.enabledBufferOptimization ?? DEFAULT_ENABLED_BUFFER_OPTIMIZATION;
            needToUpdate = true;
        }

        if (nextProps.itemRenderer !== this._itemRenderer) {
            this.itemRenderer = nextProps.itemRenderer;
            needToUpdate = true;
        }

        if (nextProps.itemSize !== this._itemSize) {
            this.itemSize = nextProps.itemSize ?? DEFAULT_ITEM_SIZE;
            needToUpdate = true;
        }

        if (nextProps.items !== this._items) {
            this.items = nextProps.items ?? [];
            needToUpdate = true;
        }

        if (nextProps.bufferSize !== this._bufferSize) {
            this.bufferSize = nextProps.bufferSize ?? DEFAULT_BUFFER_SIZE;
            needToUpdate = true;
        }

        if (nextProps.maxBufferSize !== this._maxBufferSize) {
            this.maxBufferSize = nextProps.maxBufferSize ?? DEFAULT_MAX_BUFFER_SIZE;
            needToUpdate = true;
        }

        if (nextProps.snap !== this._snap) {
            this.snap = nextProps.snap ?? DEFAULT_SNAP;
            needToUpdate = true;
        }

        if (nextProps.snappingMethod !== this._snappingMethod) {
            this.snappingMethod = nextProps.snappingMethod ?? DEFAULT_SNAPPING_METHOD;
            needToUpdate = true;
        }

        if (nextProps.stickyMap !== this._stickyMap) {
            this.stickyMap = nextProps.stickyMap ?? {};
            needToUpdate = true;
        }

        if (nextProps.trackBy !== this._trackBy) {
            this.trackBy = nextProps.trackBy ?? TRACK_BY_PROPERTY_NAME;
            needToUpdate = true;
        }

        if (nextProps.onScroll !== this._onScroll) {
            this._onScroll = nextProps.onScroll;
        }

        if (nextProps.onScrollEnd !== this._onScrollEnd) {
            this._onScrollEnd = nextProps.onScrollEnd;
        }

        if (this.state.displayComponentsList !== nextState.displayComponentsList
            || this.state.isVertical !== nextState.isVertical
            || this.state.scrollSize !== nextState.scrollSize
            || this.state.bounds !== nextState.bounds
        ) {
            needToUpdate = true;
        }

        this.update();

        return needToUpdate;
    }

    private _debouncedInitialize = debounce(() => {
        if (!this._initialized) {
            this._trackBox.displayComponents = this._displayComponents;

            this.initializeComponent();

            this.initializeSnappedComponent();

            this.resetRenderers();

            this.observeComponentRenderers();
        }

        this._initialized = true;
    });

    componentDidMount(): void {
        this._debouncedInitialize.execute();
    }

    private observeComponentRenderers() {
        this.disposeObserveComponentRenderers();
        this._observeComponentRenderersTimeout = setTimeout(() => {
            this.executeResizeObserverQueue();
            this.observeComponentRenderers();
        }) as unknown as number;
    }

    private initializeComponent() {
        const containerEl = this._$containerRef.current;
        if (containerEl) {
            // for direction calculation
            containerEl.addEventListener(SCROLL, this._onContainerScrollHandler);
            containerEl.addEventListener(SCROLL_END, this._onContainerScrollEndHandler);

            containerEl.addEventListener(SCROLL, this._onScrollHandler);

            this._resizeObserver = new ResizeObserver(this._onResizeHandler);
            this._resizeObserver.observe(containerEl);

            this._onResizeHandler();
        }
    }

    protected update() {
        const items = this._items, bounds = this._bounds, initialized = this._initialized;
        if (initialized && bounds && items) {
            const { width, height } = bounds, isVertical = this._isVertical, stickyMap = this._stickyMap,
                itemSize = this._itemSize, dynamicSize = this._dynamicSize, snap = this._snap, bufferSize = this._bufferSize,
                maxBufferSize = this._maxBufferSize, enabledBufferOptimization = this._enabledBufferOptimization,
                scrollSize = (this._isVertical
                    ? this._$containerRef?.current?.scrollTop ?? 0
                    : this._$containerRef?.current?.scrollLeft) ?? 0;
            let actualScrollSize = scrollSize;
            const opts: IUpdateCollectionOptions<IVirtualListItem, IVirtualListCollection> = {
                bounds: { width, height }, dynamicSize, isVertical, itemSize,
                bufferSize, maxBufferSize, scrollSize: actualScrollSize, snap, enabledBufferOptimization,
            };
            const { displayItems, totalSize } = this._trackBox.updateCollection(items, stickyMap, opts);

            this.resetBoundsSize(isVertical, totalSize);

            this.createDisplayComponentsIfNeed(displayItems);

            this.tracking();

            if (this._isSnappingMethodAdvanced) {
                this._resizeSnappedComponentHandler();
            }

            const container = this._$containerRef;
            if (container) {
                const delta = this._trackBox.delta;
                actualScrollSize = scrollSize + delta;
                this._trackBox.clearDelta();
                if (this._scrollSize !== actualScrollSize) {
                    const params: ScrollToOptions = {
                        [this._isVertical ? TOP_PROP_NAME : LEFT_PROP_NAME]: actualScrollSize,
                        behavior: BEHAVIOR_INSTANT as ScrollBehavior
                    };

                    container.current?.scrollTo(params);
                    this.scrollSize = actualScrollSize;
                }
            }
        }
    }

    private initializeSnappedComponent() {
        this._trackBox.snapedDisplayComponent = this._snapedDisplayComponent;
    }

    private listenCacheChangesIfNeed(value: boolean) {
        if (value) {
            if (!this._trackBox.hasEventListener(TRACK_BOX_CHANGE_EVENT_NAME, this._onTrackBoxChangeHandler)) {
                this._trackBox.addEventListener(TRACK_BOX_CHANGE_EVENT_NAME, this._onTrackBoxChangeHandler);
            }
        } else {
            if (this._trackBox.hasEventListener(TRACK_BOX_CHANGE_EVENT_NAME, this._onTrackBoxChangeHandler)) {
                this._trackBox.removeEventListener(TRACK_BOX_CHANGE_EVENT_NAME, this._onTrackBoxChangeHandler);
            }
        }
    }

    private getIsSnappingMethodAdvanced(m?: SnappingMethod) {
        const method = m || this._snappingMethod;
        return isSnappingMethodAdvenced(method);
    }

    private getIsVertical(d?: Direction) {
        const dir = d || this._direction;
        return isDirection(dir, Directions.VERTICAL);
    }

    /**
     * Returns the bounds of an element with a given id
     */
    public getItemBounds(id: Id): ISize | undefined {
        return this._trackBox.getItemBounds(id);
    }

    protected scrollToExecutor(id: Id, behavior: ScrollBehavior, iteration: number = 0, isLastIteration = false) {
        const items = this._items, bounds = this._bounds, dynamicSize = this._dynamicSize, isVertical = this._isVertical,
            itemSize = this._itemSize, bufferSize = this._bufferSize, maxBufferSize = this._maxBufferSize, snap = this._snap,
            trackBox = this._trackBox, enabledBufferOptimization = this._enabledBufferOptimization, stickyMap = this._stickyMap;
        if (!bounds || !items || !items.length) {
            return;
        }

        const container = this._$containerRef;
        if (container) {
            this.disposeScrollToRepeatExecutionTimeout();

            if (dynamicSize) {
                container.current?.removeEventListener(SCROLL_END, this._onScrollEndHandler);
                if (container && container.current) {
                    container.current.removeEventListener(SCROLL, this._onScrollHandler);
                }

                const { width, height } = bounds, delta = trackBox.delta,
                    opts: IGetItemPositionOptions<IVirtualListItem, IVirtualListCollection> = {
                        bounds: { width, height }, collection: items, dynamicSize, isVertical, itemSize,
                        bufferSize, maxBufferSize, scrollSize: (isVertical ? container.current?.scrollTop
                            ?? 0
                            : container.current?.scrollLeft ?? 0) + delta,
                        snap, fromItemId: id, enabledBufferOptimization,
                    },
                    scrollSize = trackBox.getItemPosition(id, stickyMap, opts),
                    params: ScrollToOptions = { [isVertical ? TOP_PROP_NAME : LEFT_PROP_NAME]: scrollSize, behavior };

                if (scrollSize === -1) {
                    container.current?.addEventListener(SCROLL_END, this._onScrollEndHandler);
                    container.current?.addEventListener(SCROLL, this._onScrollHandler);
                    return;
                }

                trackBox.clearDelta();

                if (container) {
                    const { displayItems, totalSize } = trackBox.updateCollection(items, stickyMap, {
                        ...opts, scrollSize, fromItemId: isLastIteration ? undefined : id,
                    }), delta = trackBox.delta;

                    trackBox.clearDelta();

                    let actualScrollSize = scrollSize + delta;

                    this.resetBoundsSize(isVertical, totalSize);

                    this.createDisplayComponentsIfNeed(displayItems);

                    this.tracking();

                    const _scrollSize = trackBox.getItemPosition(id, stickyMap, { ...opts, scrollSize: actualScrollSize, fromItemId: id }),
                        notChanged = actualScrollSize === _scrollSize;

                    if (_scrollSize === -1) {
                        container.current?.addEventListener(SCROLL_END, this._onScrollEndHandler);
                        container.current?.addEventListener(SCROLL, this._onScrollHandler);
                        return;
                    }

                    if (!notChanged || iteration < MAX_SCROLL_TO_ITERATIONS) {
                        this.disposeScrollToRepeatExecutionTimeout();
                        this._scrollToRepeatExecutionTimeout = setTimeout(() => {
                            this.scrollToExecutor(id, BEHAVIOR_INSTANT as ScrollBehavior, iteration + 1, notChanged);
                        }) as unknown as number;
                    } else {
                        this.scrollSize = actualScrollSize;

                        container.current?.addEventListener(SCROLL, this._onScrollHandler);
                    }
                }

                container.current?.scrollTo(params);

                this.scrollSize = scrollSize;
            } else {
                const _scrollSize = (isVertical ? container.current?.scrollTop ?? 0 : container.current?.scrollLeft ?? 0),
                    index = items.findIndex(item => item.id === id);

                if (index > -1) {
                    const scrollSize = index * itemSize;

                    if (_scrollSize !== scrollSize) {
                        const params: ScrollToOptions = { [isVertical ? TOP_PROP_NAME : LEFT_PROP_NAME]: scrollSize, behavior };
                        container.current?.scrollTo(params);
                    }
                }
            }
        }
    }

    private resetRenderers() {
        const doMap: { [id: number]: number } = {}, components = this._displayComponents;
        for (let i = 0, l = components.length; i < l; i++) {
            const item = components[i].current;
            if (item) {
                const id = item.id;
                doMap[id] = i;
            }
        }

        this._trackBox.setDisplayObjectIndexMapById(doMap);
    }

    private _resizeObserveQueue: Array<React.RefObject<IVirtualListItemMethods | null>> = [];

    private executeResizeObserverQueue() {
        let isChanged = false;
        const queue = this._resizeObserveQueue, newQueue: Array<RefObject<IVirtualListItemMethods | null>> = [];
        for (let l = queue.length, ei = l - 1, i = ei; i >= 0; i--) {
            const ref = queue[i], el = ref.current?.element;
            if (el) {
                isChanged = true;
                this._componentsResizeObserver?.observe(el);
                this._resizeObserveQueue.slice(i, 1);
                continue;
            }

            newQueue.push(ref);
        }

        if (isChanged) {
            this.displayComponentsList = [...this._displayComponentsList];
        }

        const snappedDisplayComponentRef = this._snapedDisplayComponent.current;
        this._trackBox.snapedDisplayComponent = this._snapedDisplayComponent;
        if (snappedDisplayComponentRef && !this._resizeSnappedObserver) {
            const element = snappedDisplayComponentRef?.element;
            if (element) {
                this._resizeSnappedObserver = new ResizeObserver(this._resizeSnappedComponentHandler);
                this._resizeSnappedObserver.observe(element);
            }
        }

        this._resizeObserveQueue = newQueue;
    }

    private waitToResizeObserve(ref: React.RefObject<IVirtualListItemMethods | null>) {
        this._resizeObserveQueue.push(ref);
    }

    private createDisplayComponentsIfNeed(displayItems: IRenderVirtualListCollection | null) {
        if (!displayItems || !this._$listRef) {
            this._trackBox.setDisplayObjectIndexMapById({});
            return;
        }

        this._trackBox.items = displayItems;

        let isChanged = false;

        const _listContainerRef = this._$listRef,
            components = this._displayComponents;

        while (components.length < displayItems.length) {
            if (_listContainerRef) {
                isChanged = true;

                const ref = createRef<VirtualListItem>();

                components.push(ref);

                this.waitToResizeObserve(ref);
            }
        }

        if (isChanged) {
            this.displayComponentsList = [...components];
        }

        this.resetRenderers();
    }

    /**
     * Tracking by id
     */
    protected tracking() {
        this._trackBox.track();
    }

    private resetBoundsSize = (isVertical: boolean, totalSize: number) => {
        const l = this._$listRef;
        if (l && l.current) {
            l.current.style[isVertical ? HEIGHT_PROP_NAME : WIDTH_PROP_NAME] = `${totalSize}${PX}`;
        }
    }

    /**
     * The method scrolls the list to the element with the given id and returns the value of the scrolled area.
     * Behavior accepts the values ​​"auto", "instant" and "smooth".
     */
    public scrollTo(id: Id, behavior: ScrollBehavior = BEHAVIOR_AUTO as ScrollBehavior) {
        this.scrollToExecutor(id, behavior);
    }

    /**
     * Scrolls the scroll area to the desired element with the specified ID.
     */
    public scrollToEnd(behavior: ScrollBehavior = BEHAVIOR_INSTANT as ScrollBehavior) {
        const items = this._items;
        const latItem = items?.[items.length > 0 ? items.length - 1 : 0];
        if (latItem) {
            this.scrollTo(latItem.id, behavior);
        }
    }

    render(): React.ReactNode {
        const { displayComponentsList } = this.state;
        const isVertical = this._isVertical;

        return <div ref={this._$elementRef} className={`rcxvl ${this._className} ${isVertical ? CLASS_LIST_VERTICAL : CLASS_LIST_HORIZONTAL}`}>
            {
                this._snap && this._isSnappingMethodAdvanced &&
                <div ref={this._$snappedRef} className="rcxvl__list-snapper snapped-item">
                    {<VirtualListItem ref={this._snapedDisplayComponent} regular={true} renderer={this._itemRenderer} />}
                </div>
            }
            <div ref={this._$containerRef} className="rcxvl__scroller">
                <ul ref={this._$listRef} className="rcxvl__list">
                    {displayComponentsList.map((ref, index) => <VirtualListItem ref={ref} key={String(index)} renderer={this._itemRenderer} />)}
                </ul>
            </div>
        </div>
    }

    private disposeScrollToRepeatExecutionTimeout() {
        clearTimeout(this._scrollToRepeatExecutionTimeout);
    }

    private disposeObserveComponentRenderers() {
        clearTimeout(this._observeComponentRenderersTimeout);
    }

    componentWillUnmount(): void {
        this.disposeScrollToRepeatExecutionTimeout();

        this.disposeObserveComponentRenderers();

        if (this._debouncedInitialize) {
            this._debouncedInitialize.dispose();
        }

        if (this._trackBox) {
            this._trackBox.dispose();
        }

        if (this._componentsResizeObserver) {
            this._componentsResizeObserver.disconnect();
        }

        if (this._resizeSnappedObserver) {
            this._resizeSnappedObserver.disconnect();
        }

        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }

        const containerEl = this._$containerRef.current;
        if (containerEl) {
            containerEl.removeEventListener(SCROLL, this._onScrollHandler);
            containerEl.removeEventListener(SCROLL, this._onContainerScrollHandler);
            containerEl.removeEventListener(SCROLL_END, this._onContainerScrollEndHandler);
        }
    }
}