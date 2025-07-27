import { IVirtualListItemMethods, ScrollDirection } from "../models";
import { Id, ISize } from "../types";

type TrackingPropertyId = string | number;

export interface IVirtualListItemComponent<I = any> {
    getBounds(): ISize;
    itemId: Id;
    id: number;
    item: I | null;
    show: () => void;
    hide: () => void;
}

/**
 * Tracks display items by property
 * @link https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/utils/tracker.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export class Tracker<C extends IVirtualListItemMethods = any> {
    /**
     * display objects dictionary of indexes by id
     */
    private _displayObjectIndexMapById: { [id: number]: number } = {};

    set displayObjectIndexMapById(v: { [id: number]: number }) {
        if (this._displayObjectIndexMapById === v) {
            return;
        }

        this._displayObjectIndexMapById = v;
    }

    get displayObjectIndexMapById() {
        return this._displayObjectIndexMapById;
    }

    /**
     * Dictionary displayItems propertyNameId by items propertyNameId
     */
    private _trackMap: { [id: TrackingPropertyId]: number } | null = {};

    get trackMap() {
        return this._trackMap;
    }

    private _trackingPropertyName!: string;

    set trackingPropertyName(v: string) {
        this._trackingPropertyName = v;
    }

    constructor(trackingPropertyName: string) {
        this._trackingPropertyName = trackingPropertyName;
    }

    /**
     * tracking by propName
     */
    track(items: Array<any>, components: Array<React.RefObject<C>>, snapedComponent: React.RefObject<C> | null | undefined,
        direction: ScrollDirection): void {
        if (!items) {
            return;
        }

        const idPropName = this._trackingPropertyName, untrackedItems = [...components], isDown = direction === 0 || direction === 1;
        let isRegularSnapped = false;

        for (let i = isDown ? 0 : items.length - 1, l = isDown ? items.length : 0; isDown ? i < l : i >= l; isDown ? i++ : i--) {
            const item = items[i], itemTrackingProperty = item[idPropName];

            if (this._trackMap) {
                if (this._trackMap.hasOwnProperty(itemTrackingProperty)) {
                    const diId = this._trackMap[itemTrackingProperty],
                        compIndex = this._displayObjectIndexMapById[diId], comp = components[compIndex];

                    const compId = comp?.current?.id;
                    if (comp?.current && compId === diId) {
                        const indexByUntrackedItems = untrackedItems.findIndex(v => {
                            return v.current && v.current.id === compId;
                        });
                        if (indexByUntrackedItems > -1) {
                            if (snapedComponent?.current) {
                                if (item['config']['snapped'] || item['config']['snappedOut']) {
                                    isRegularSnapped = true;
                                    snapedComponent.current.data = item;
                                    snapedComponent.current.show();
                                }
                            }
                            comp.current.data = item;

                            if (snapedComponent?.current) {
                                if (item['config']['snapped'] || item['config']['snappedOut']) {
                                    comp.current.hide();
                                } else {
                                    comp.current.show();
                                }
                            } else {
                                comp.current.show();
                            }
                            untrackedItems.splice(indexByUntrackedItems, 1);
                            continue;
                        }
                    }
                    delete this._trackMap[itemTrackingProperty];
                }
            }

            if (untrackedItems.length > 0) {
                const comp = untrackedItems.shift(), item = items[i];
                if (comp?.current) {
                    if (snapedComponent?.current) {
                        if (item['config']['snapped'] || item['config']['snappedOut']) {
                            isRegularSnapped = true;
                            snapedComponent.current.data = item;
                            snapedComponent.current.show();
                        }
                    }
                    comp.current.data = item;
                    if (snapedComponent?.current) {
                        if (item['config']['snapped'] || item['config']['snappedOut']) {
                            comp.current.hide();
                        } else {
                            comp.current.show();
                        }
                    } else {
                        comp.current.show();
                    }

                    if (this._trackMap) {
                        this._trackMap[itemTrackingProperty] = comp.current.id;
                    }
                }
            }
        }

        if (untrackedItems.length) {
            for (let i = 0, l = untrackedItems.length; i < l; i++) {
                const comp = untrackedItems[i];
                if (comp?.current) {
                    comp.current.hide();
                }
            }
        }

        if (!isRegularSnapped) {
            if (snapedComponent?.current) {
                snapedComponent.current.data = null;
                snapedComponent.current.hide();
            }
        }
    }

    untrackComponentByIdProperty(component?: C): void {
        if (!component) {
            return;
        }

        const propertyIdName = this._trackingPropertyName;

        if (this._trackMap && (component as any)[propertyIdName] !== undefined) {
            delete this._trackMap[propertyIdName];
        }
    }

    dispose() {
        this._trackMap = null;
    }
}