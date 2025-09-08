import React, { createRef, MouseEvent } from 'react';
import { IVirtualListItemMethods, VirtualListItemRenderer } from '../models';
import { IRenderVirtualListItem } from '../models/render-item.model';
import { ISize } from '../types';
import {
    CLASS_DEFAULT_ITEM, CLASS_ITEM, CLASS_ITEM_EVEN, CLASS_ITEM_ODD, CLASS_ITEM_SNAPPED, CLASS_ITEM_SNAPPED_OUT,
    DEFAULT_ZINDEX, DISPLAY_BLOCK, DISPLAY_NONE, HIDDEN_ZINDEX, POSITION_ABSOLUTE, POSITION_STICKY, PX, SIZE_100_PERSENT, SIZE_AUTO,
    TRANSLATE_3D, VISIBILITY_HIDDEN, VISIBILITY_VISIBLE, ZEROS_TRANSLATE_3D,
} from '../const';
import { VirtualListContext } from '../virtual-list-service';

export interface IVirtualListItemProps {
    regular?: boolean;
    renderer?: VirtualListItemRenderer;
}

interface IVirtualListItemState {
    data: IRenderVirtualListItem | undefined;
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
export class VirtualListItem extends React.Component<IVirtualListItemProps, IVirtualListItemState> implements IVirtualListItemMethods {
    static contextType = VirtualListContext as any;

    context!: React.ContextType<typeof VirtualListContext>;

    private _onClickHandler = (e?: MouseEvent<HTMLLIElement>): void => {
        if (this.context) {
            this.context.itemClick(this._data);
        }
    }

    private _$elementRef = createRef<HTMLDivElement>();

    private _$listItemRef = createRef<HTMLLIElement>();

    private static __nextId: number = 0;

    private _id!: number;
    get id() {
        return this._id;
    }

    protected _regular: boolean = false;
    get regular() { return this._regular; }

    private _data: IRenderVirtualListItem | undefined = undefined;
    get data() { return this._data; }

    set data(v: IRenderVirtualListItem | undefined) {
        if (this._data === v) {
            return;
        }

        this._data = v;

        this.update();

        this.setState(v => ({
            ...v,
            data: this._data,
        }));
    }

    protected _regularLength: string = SIZE_100_PERSENT;
    set regularLength(v: string) {
        if (this._regularLength === v) {
            return;
        }

        this._regularLength = v;

        this.update();
    }
    get regularLength() { return this._regularLength; }

    get item() {
        return this._data;
    }

    get itemId() {
        return this._data?.id;
    }

    get element() {
        return this._$elementRef?.current;
    }

    protected _renderer: VirtualListItemRenderer = DEFAULT_ITEM_RENDERER_FACTORY;
    get renderer() { return this._renderer; }

    set renderer(v: VirtualListItemRenderer) {
        if (this._renderer !== v) {
            this._renderer = v;

            this.update();
        }
    }

    constructor(props: IVirtualListItemProps) {
        super(props);

        this._id = VirtualListItem.__nextId = VirtualListItem.__nextId === Number.MAX_SAFE_INTEGER
            ? 0 : VirtualListItem.__nextId + 1;

        this._regular = props.regular ?? false;
        this._renderer = props.renderer ?? DEFAULT_ITEM_RENDERER_FACTORY;

        this.state = {
            data: undefined,
        }
    }

    protected update() {
        const data = this._data, regular = this._regular, length = this._regularLength, element = this._$elementRef.current;
        if (data && element) {
            const styles = element.style;
            styles.zIndex = data.config.zIndex;
            if (data.config.snapped) {
                styles.transform = data.config.sticky === 1 ? ZEROS_TRANSLATE_3D : `${TRANSLATE_3D}(${data.config.isVertical ? 0 : data.measures.x}${PX}, ${data.config.isVertical ? data.measures.y : 0}${PX} , 0)`;
                if (!data.config.isSnappingMethodAdvanced) {
                    styles.position = POSITION_STICKY;
                }
            } else {
                styles.position = POSITION_ABSOLUTE;
                if (regular) {
                    styles.transform = `${TRANSLATE_3D}(${data.config.isVertical ? 0 : data.measures.delta}${PX}, ${data.config.isVertical ? data.measures.delta : 0}${PX} , 0)`;
                } else {
                    styles.transform = `${TRANSLATE_3D}(${data.config.isVertical ? 0 : data.measures.x}${PX}, ${data.config.isVertical ? data.measures.y : 0}${PX} , 0)`;
                }
            }
            styles.height = data.config.isVertical ? data.config.dynamic ? SIZE_AUTO : `${data.measures.height}${PX}` : regular ? length : SIZE_100_PERSENT;
            styles.width = data.config.isVertical ? regular ? length : SIZE_100_PERSENT : data.config.dynamic ? SIZE_AUTO : `${data.measures.width}${PX}`;
        }
    }

    getSnapshotBeforeUpdate(prevProps: Readonly<IVirtualListItemProps>, prevState: Readonly<IVirtualListItemState>) {
        return null;
    }

    componentDidUpdate(prevProps: Readonly<IVirtualListItemProps>, prevState: Readonly<IVirtualListItemState>, snapshot?: any): void {

    }

    shouldComponentUpdate(nextProps: Readonly<IVirtualListItemProps>, nextState: Readonly<IVirtualListItemState>): boolean {
        let needToUpdate = false;
        if (this._renderer !== nextProps.renderer) {
            this.renderer = nextProps.renderer ?? DEFAULT_ITEM_RENDERER_FACTORY;
            needToUpdate = true;
        }

        if (this._regular !== nextProps.regular) {
            needToUpdate = true;
        }

        if (this.state !== nextState) {
            needToUpdate = true;
        }

        return needToUpdate;
    }

    getBounds(): ISize {
        const element = this._$elementRef.current,
            { width, height } = element?.getBoundingClientRect() ?? { width: 0, height: 0 };
        return { width, height };
    }

    show() {
        const element = this._$elementRef.current;
        if (!element) {
            return;
        }

        const regular = this._regular, styles = element.style;
        if (regular) {
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
        styles.zIndex = styles.zIndex = this._data?.config?.zIndex ?? DEFAULT_ZINDEX;
    }

    hide() {
        const element = this._$elementRef.current;
        if (!element) {
            return;
        }

        const regular = this._regular, styles = element.style;
        if (regular) {
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
        styles.position = POSITION_ABSOLUTE;
        styles.transform = ZEROS_TRANSLATE_3D;
        styles.zIndex = HIDDEN_ZINDEX;
    }


    private classNames(data: IRenderVirtualListItem, ...classes: Array<string>) {
        const result = [CLASS_DEFAULT_ITEM, ...(classes ?? [])];
        if (data.config.snapped) {
            result.push(CLASS_ITEM_SNAPPED);
        }
        if (data.config.snappedOut) {
            result.push(CLASS_ITEM_SNAPPED_OUT);
        }
        if (data.config.odd) {
            result.push(CLASS_ITEM_ODD);
        }
        if (data.config.even) {
            result.push(CLASS_ITEM_EVEN);
        }
        return result.join(' ');
    }

    render(): React.ReactNode {
        const renderer = this._renderer, itemRenderer = { renderer }, data = this._data;
        return <div ref={this._$elementRef} className={CLASS_ITEM}>
            {
                this._data &&
                <li ref={this._$listItemRef} className={this.classNames(this._data)} onClick={this._onClickHandler}>
                    {(renderer !== undefined || renderer !== null) && <itemRenderer.renderer data={data?.data!} config={data?.config!} />}
                </li>
            }
        </div>
    }
}
