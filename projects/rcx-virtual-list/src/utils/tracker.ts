import { ScrollDirection } from "../models";

type TrackingPropertyId = string | number;

interface IVirtualListItemComponent<I = any> {
    getId: () => number;
    setData: (data: I) => void;
    show: () => void;
    hide: () => void;
    [prop: string]: any;
}

/**
 * Tracks display items by property
 * @link https://github.com/DjonnyX/ng-virtual-list/blob/14.x/projects/ng-virtual-list/src/lib/utils/tracker.ts
 * @author Evgenii Grebennikov
 * @email djonnyx@gmail.com
 */
export class Tracker<I = any, C extends IVirtualListItemComponent = any> {
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
    track(items: Array<any>, components: Array<React.RefObject<C>>,
        direction: ScrollDirection): void {
        if (!items) {
            return;
        }

        const idPropName = this._trackingPropertyName, untrackedItems = [...components], isDown = direction === 0 || direction === 1;

        for (let i = isDown ? 0 : items.length - 1, l = isDown ? items.length : 0; isDown ? i < l : i >= l; isDown ? i++ : i--) {
            const item = items[i], itemTrackingProperty = item[idPropName];

            if (this._trackMap) {
                if (this._trackMap.hasOwnProperty(itemTrackingProperty)) {
                    const diId = this._trackMap[itemTrackingProperty],
                        compIndex = this._displayObjectIndexMapById[diId], ref = components[compIndex];

                    const compId = ref?.current?.id;
                    if (ref !== undefined && compId === diId) {
                        const indexByUntrackedItems = untrackedItems.findIndex((ref) => {
                            return ref.current.id === compId;
                        });
                        if (indexByUntrackedItems > -1) {
                            if (ref.current) {
                                ref.current.setData(item);
                                ref.current.show();
                            }
                            untrackedItems.splice(indexByUntrackedItems, 1);
                            continue;
                        }
                    }
                    delete this._trackMap[itemTrackingProperty];
                }
            }

            if (untrackedItems.length > 0) {
                const el = untrackedItems.shift(), item = items[i];
                if (el) {
                    const ref = el;
                    if (ref.current) {
                        ref.current.setData(item);

                        if (this._trackMap) {
                            this._trackMap[itemTrackingProperty] = ref.current.id;
                        }
                    }
                }
            }
        }

        if (untrackedItems.length) {
            for (let i = 0, l = untrackedItems.length; i < l; i++) {
                const ref = untrackedItems[i];
                if (ref && ref.current) {
                    ref.current.hide();
                }
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