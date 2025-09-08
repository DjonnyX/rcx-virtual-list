# RcxVirtualList

Maximum performance for extremely large lists.<br/>
Flexible, and actively maintained React library that excels with high-performance, feature-rich virtualized lists—including grouping, sticky headers, snapping, animations, and both scroll directions. Whether you're rendering millions of items or building interactive list components, it delivers scalability and customization.

Ported from [ng-virtual-list](https://github.com/DjonnyX/ng-virtual-list/tree/main/projects/ng-virtual-list)

<img width="1033" height="171" alt="logo" src="https://github.com/user-attachments/assets/32a5f3da-83e2-4801-882b-b198f2d37e7a" />

React version 16.X.X - 19.X.X.

[Live Demo](https://rcx-virtual-list-chat-demo.eugene-grebennikov.pro/)

[Live Examples](https://rcx-virtual-list.eugene-grebennikov.pro/)

<br/>

| **Pros** | **Description** |
| --- | --- |
| **High performance** | Only renders items visible in the viewport (plus a buffer), reducing DOM overhead and improving responsiveness—even with very large datasets |
| **Grouped lists with sticky headers & snapping** | Supports grouping items, sticky headers, and optional “snap” behavior for clean section scrolling |
| **React (16–19) compatibility** | Compatible with React versions 16 through 19.x, ensuring seamless integration in modern React projects |
| **Scroll-to capabilities** | Allows programmatic navigation to specific items by ID |
| **TypeScript support** | Comes with typing for safety and better integration in TypeScript projects |

<br/>

## When to Use It: Ideal Use Cases

Drawing on general virtual-scroll insights and rcx-virtual-list features:

Long-Scrolling Lists / Live Feeds
When displaying hundreds of thousands of items (think social media feeds, chat logs, or news streams), rcx-virtual-list ensures smooth and responsive rendering without overwhelming the browser.

Horizontal Carousels or Galleries
Ideal for media-rich UI elements like image galleries, product cards, or horizontal scrollers.

Grouped Navigation with Section Headers
For catalogs, logs, or grouped entries (e.g., by date or category), you can use sticky headers and snapping to guide user navigation effectively. 

"Jump to" Item Navigation
Use cases like directories or chat histories benefit from the ability to scroll directly to specific items by ID. 

Complex or Rich-Content Templates
As each item may contain images, nested components, or interactions, virtual rendering keeps performance intact even when item complexity increases.

<br/>

## Installation

```bash
npm i rcx-virtual-list
```

## Examples

### Horizontal virtual list

![preview](https://github.com/user-attachments/assets/5a16d4b3-5e66-4d53-ae90-d0eab0b246a1)

Code:
```tsx
const horizontalItemRendererFactory = (): VirtualListItemRenderer => ({ data, config }) => {
  if (!data) {
    return;
  }

  return <div className="list__h-container">{data?.name}</div>
};

const MAX_ITEMS = 10000;

const HORIZONTAL_ITEMS: IVirtualListCollection = [];
for (let i = 0, l = MAX_ITEMS; i < l; i++) {
  const id = i + 1;
  HORIZONTAL_ITEMS.push({ id, name: `${id}` });
}

function App() {
  const [horizontalItems] = useState([...HORIZONTAL_ITEMS]);

  const onItemClick = (item: IRenderVirtualListItem<IItemData>) => {
    console.info(`Click: (ID: ${item.id}) Item ${item.data.name}`);
  };

  return <VirtualList className="list" direction="hotizontal" itemRenderer={horizontalItemRendererFactory()} items={horizontalItems}
    itemSize={54} bufferSize={50} onItemClick={onItemClick}/>
}
```

### Horizontal grouped virtual list

![preview](https://github.com/user-attachments/assets/99584660-dc0b-4cd0-9439-9b051163c077)

Code:
```tsx
const horizontalGroupItemRendererFactory = (): VirtualListItemRenderer => ({ data, config }) => {
  if (!data) {
    return;
  }

  switch (data['type']) {
    case 'group-header': {
      return <div className="list__h-group-container">{data?.name}</div>
    }
    case 'item': {
      return <div className="list__h-container">{data?.name}</div>
    }
  }
};

const MAX_ITEMS = 10000, GROUP_NAMES = ['A', 'B', 'C', 'D', 'E'];

const getGroupName = () => {
  return GROUP_NAMES[Math.floor(Math.random() * GROUP_NAMES.length)];
};

const HORIZONTAL_GROUP_ITEMS: IVirtualListCollection = [],
  HORIZONTAL_GROUP_ITEMS_STICKY_MAP: IVirtualListStickyMap = {};

for (let i = 0, l = MAX_ITEMS; i < l; i++) {
  const id = i + 1, type = i === 0 || Math.random() > .895 ? 'group-header' : 'item';
  HORIZONTAL_GROUP_ITEMS.push({ id, type, name: type === 'group-header' ? getGroupName() : `${id}` });
  HORIZONTAL_GROUP_ITEMS_STICKY_MAP[id] = type === 'group-header' ? 1 : 0;
}

function App() {
  const [horizontalGroupItems] = useState([...HORIZONTAL_GROUP_ITEMS]);
  const [horizontalGroupItemsStickyMap] = useState({ ...HORIZONTAL_GROUP_ITEMS_STICKY_MAP });

  return <VirtualList className="list" direction="hotizontal" itemRenderer={horizontalGroupItemRendererFactory()}
            items={horizontalGroupItems} itemSize={54} bufferSize={50} snap={true} stickyMap={horizontalGroupItemsStickyMap} />
}
```

### Vertical virtual list

![preview](https://github.com/user-attachments/assets/ca00eec9-fa9e-4e8d-8899-23343e4bd8a5)

Code:
```tsx
const itemRendererFactory = (): VirtualListItemRenderer => ({ data, config }) => {
  if (!data) {
    return;
  }

  return <div className="list__container">{data?.name}</div>
};

const MAX_ITEMS = 10000;

const ITEMS: IVirtualListCollection = [];
for (let i = 0, l = MAX_ITEMS; i < l; i++) {
  const id = i + 1;
  ITEMS.push({ id, name: `Item: ${id}` });
}

function App() {
  const [verticalItems] = useState([...ITEMS]);

  const onItemClick = (item: IRenderVirtualListItem<IItemData>) => {
    console.info(`Click: (ID: ${item.id}) Item ${item.data.name}`);
  };

  return <VirtualList className="list" direction="vertical" itemRenderer={itemRendererFactory()}
            items={verticalItems} itemSize={40} bufferSize={50} onItemClick={onItemClick} />
}
```

### Vertical grouped virtual list

#### Without snapping

![preview](https://github.com/user-attachments/assets/bd4817d8-92f2-4703-aed1-ab7ca18a751e)

Code:
```tsx
const groupItemRendererFactory = (): VirtualListItemRenderer => ({ data, config }) => {
  if (!data) {
    return;
  }

  switch (data['type']) {
    case 'group-header': {
      return <div className="list__group-container">{data?.name}</div>
    }
    case 'item': {
      return <div className="list__container">{data?.name}</div>
    }
  }
};

const MAX_ITEMS = 10000, GROUP_ITEMS: IVirtualListCollection = [],
  GROUP_ITEMS_STICKY_MAP: IVirtualListStickyMap = {};

let groupIndex = 0;
for (let i = 0, l = MAX_ITEMS; i < l; i++) {
  const id = i + 1, type = i === 0 || Math.random() > .895 ? 'group-header' : 'item';
  if (type === 'group-header') {
    groupIndex++;
  }
  GROUP_ITEMS.push({ id, type, name: type === 'group-header' ? `Group ${groupIndex}` : `Item: ${id}` });
  GROUP_ITEMS_STICKY_MAP[id] = type === 'group-header' ? 1 : 0;
}

function App() {
  const [groupItems] = useState([...GROUP_ITEMS]);
  const [groupItemsStickyMap] = useState({ ...GROUP_ITEMS_STICKY_MAP });

  const onItemClick = (item: IRenderVirtualListItem<IItemData>) => {
    console.info(`Click: (ID: ${item.id}) Item ${item.data.name}`);
  };

  return <VirtualList className="list" items={groupItems} itemRenderer={groupItemRendererFactory()} bufferSize={50}
            stickyMap={groupItemsStickyMap} itemSize={40} onItemClick={onItemClick} />
}
```

#### With snapping

![preview](https://github.com/user-attachments/assets/d2101d78-73c8-4f2e-900a-1b55bc554f13)

Code
```tsx
const groupItemRendererFactory = (): VirtualListItemRenderer => ({ data, config }) => {
  if (!data) {
    return;
  }

  switch (data['type']) {
    case 'group-header': {
      return <div className="list__group-container">{data?.name}</div>
    }
    case 'item': {
      return <div className="list__container">{data?.name}</div>
    }
  }
};

const MAX_ITEMS = 10000, GROUP_ITEMS: IVirtualListCollection = [],
  GROUP_ITEMS_STICKY_MAP: IVirtualListStickyMap = {};

let groupIndex = 0;
for (let i = 0, l = MAX_ITEMS; i < l; i++) {
  const id = i + 1, type = i === 0 || Math.random() > .895 ? 'group-header' : 'item';
  if (type === 'group-header') {
    groupIndex++;
  }
  GROUP_ITEMS.push({ id, type, name: type === 'group-header' ? `Group ${groupIndex}` : `Item: ${id}` });
  GROUP_ITEMS_STICKY_MAP[id] = type === 'group-header' ? 1 : 0;
}

function App() {
  const [groupItems] = useState([...GROUP_ITEMS]);
  const [groupItemsStickyMap] = useState({ ...GROUP_ITEMS_STICKY_MAP });

  const onItemClick = (item: IRenderVirtualListItem<IItemData>) => {
    console.info(`Click: (ID: ${item.id}) Item ${item.data.name}`);
  };

  return <VirtualList className="list" items={groupItems} itemRenderer={groupItemRendererFactory()} bufferSize={50}
            stickyMap={groupItemsStickyMap} itemSize={40} snap={true} onItemClick={onItemClick} />
}
```

### ScrollTo

The example demonstrates the scrollTo method by passing it the element id. It is important not to confuse the ordinal index and the element id. In this example, id = index + 1

![preview](https://github.com/user-attachments/assets/18aa0fd5-8953-4736-9725-b3a4c8b5b4b4)

Code
```tsx
const itemRendererFactory = (): VirtualListItemRenderer => ({ data, config }) => {
  if (!data) {
    return;
  }

  return <div className="list__container">{data?.name}</div>
};

const MAX_ITEMS = 10000;

const ITEMS: IVirtualListCollection = [];
for (let i = 0, l = MAX_ITEMS; i < l; i++) {
  const id = i + 1;
  ITEMS.push({ id, name: `Item: ${id}` });
}

function App() {
  const $listContainerRef = useRef<IVirtualListMethods>(null);
  const [verticalItems] = useState([...ITEMS]);
  const [minId] = useState<Id>(() => {
    return verticalItems1.length > 0 ? verticalItems1[0].id : 0;
  });
  const [maxId] = useState<Id>(() => {
    return verticalItems1.length > 0 ? verticalItems1[verticalItems1.length - 1].id : 0;
  });
  const itemId = useRef<Id>(minId);

  const onItemClick = (item: IRenderVirtualListItem<IItemData>) => {
    console.info(`Click: (ID: ${item.id}) Item ${item.data.name}`);
  };

  return <>
    <div className="scroll-to__controls">
      <input type={'number'} className="scroll-to__input" value={itemId} required={true} min={minId}
        max={maxId} onChange={onInputScrollToIdChangeHandler} />
      <button className="scroll-to__button" onClick={onButtonScrollToIdClickHandler}>Scroll</button>
    </div>
    <VirtualList ref={$listContainerRef} className="list" direction="vertical" itemRenderer={itemRendererFactory()}
      items={verticalItems} itemSize={40} bufferSize={50} onItemClick={onItemClick} />
  </>
}
```

### Virtual list (with dynamic item size)

Virtual list with height-adjustable elements.

![preview](https://github.com/user-attachments/assets/3c7e8779-c15d-4eb5-a1c5-d774f614fbaf)

Code
```tsx
const groupItemRendererFactory = (): VirtualListItemRenderer => ({ data, config }) => {
  if (!data) {
    return;
  }

  switch (data['type']) {
    case 'group-header': {
      return <div className="list__group-container">{data?.name}</div>
    }
    case 'item': {
      return <div className="list__container">{data?.name}</div>
    }
  }
};

const MAX_ITEMS = 10000, 
  CHARS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const generateLetter = () => {
  return CHARS[Math.round(Math.random() * CHARS.length)];
}

const generateWord = () => {
  const length = 5 + Math.floor(Math.random() * 50), result = [];
  while (result.length < length) {
    result.push(generateLetter());
  }
  return `${result.join('')}`;
};

const generateText = () => {
  const length = 2 + Math.floor(Math.random() * 10), result = [];
  while (result.length < length) {
    result.push(generateWord());
  }
  let firstWord = '';
  for (let i = 0, l = result[0].length; i < l; i++) {
    const letter = result[0].charAt(i);
    firstWord += i === 0 ? letter.toUpperCase() : letter;
  }
  result[0] = firstWord;
  return `${result.join(' ')}.`;
};

const GROUP_DYNAMIC_ITEMS: IVirtualListCollection = [],
  GROUP_DYNAMIC_ITEMS_STICKY_MAP: IVirtualListStickyMap = {;

let groupDynamicIndex = 0;
for (let i = 0, l = MAX_ITEMS; i < l; i++) {
  const id = i + 1, type = i === 0 || Math.random() > .895 ? 'group-header' : 'item';
  if (type === 'group-header') {
    groupDynamicIndex++;
  }
  GROUP_DYNAMIC_ITEMS.push({ id, type, name: type === 'group-header' ? `Group ${id}. ${generateText()}` : `${id}. ${generateText()}` });
  GROUP_DYNAMIC_ITEMS_STICKY_MAP[id] = type === 'group-header' ? 1 : 0;
}

function App() {
  const [groupDynamicItems] = useState([...GROUP_DYNAMIC_ITEMS]);
  const [groupDynamicItemsStickyMap] = useState({ ...GROUP_DYNAMIC_ITEMS_STICKY_MAP });

  const onItemClick = (item: IRenderVirtualListItem<IItemData>) => {
    console.info(`Click: (ID: ${item.id}) Item ${item.data.name}`);
  };

function App () {
  return <VirtualList className="list" items={groupDynamicItems} itemRenderer={groupItemRendererFactory()}
            bufferSize={50} stickyMap={groupDynamicItemsStickyMap} dynamicSize={true} snap={true} onItemClick={onItemClick}/>
}
```

## Stylization

List items are encapsulated in shadowDOM, so to override default styles you need to use ::part access

- Customize a scroll area of list
```css
.list .rcxvl__scroller {
    scroll-behavior: auto;

    /* custom scrollbar */
    &::-webkit-scrollbar {
        width: 16px;
        height: 16px;
    }

    &::-webkit-scrollbar-track {
        background-color: #ffffff;
    }

    &::-webkit-scrollbar-thumb {
        background-color: #d6dee1;
        border-radius: 20px;
        border: 6px solid transparent;
        background-clip: content-box;
        min-width: 60px;
        min-height: 60px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background-color: #a8bbbf;
    }
}

.list {
    border-radius: 3px;
    box-shadow: 1px 2px 8px 4px rgba(0, 0, 0, 0.075);
    border: 1px solid rgba(0, 0, 0, 0.1);
}
```

- Set up the list item canvas
```css
.list .rcxvl__list {
    background-color: #ffffff;
}
```

- Set up the snapped item (Only SnappingMethod.ADVANCED)
```css
.list .rcxvl__snapped-item {
    color: #71718c;
}
```

- Set up the list item
```css
.list .rcxvl__item {
    background-color: unset; /* override default styles */
}
```

Selecting even elements:

```tsx
const itemRendererFactory = (): VirtualListItemRenderer => (({ data, config }) => {
  if (!data) {
    return null;
  }

  let classes = 'item__content';
  if (config.even) {
    classes += ' even';
  }
  return <div className={classes}>{data?.name}</div>
});

<VirtualList className="list" direction="vertical" itemRenderer={itemRendererFactory()}
            items={verticalItems} itemSize={40} bufferSize={50} />
```

```css
.item__content {
  &.even {
      background-color: #1d1d21;
  }
}
```

## API

[NgVirtualListComponent](https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/ng-virtual-list.component.ts)

Inputs

| Property | Type | Description |
|---|---|---|
| id | number | Readonly. Returns the unique identifier of the component. | 
| items | [IVirtualListCollection](https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/collection.model.ts) | Collection of list items. The collection of elements must be immutable. |
| itemSize | number? = 24 | If direction = 'vertical', then the height of a typical element. If direction = 'horizontal', then the width of a typical element. Ignored if the dynamicSize property is true. |
| bufferSize | number? = 2 | Number of elements outside the scope of visibility. Default value is 2. |
| maxBufferSize | number? = 100 | Maximum number of elements outside the scope of visibility. Default value is 100. If maxBufferSize is set to be greater than bufferSize, then adaptive buffer mode is enabled. The greater the scroll size, the more elements are allocated for rendering. |
| itemRenderer | [VirtualListItemRenderer](https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/virtual-list-item-renderer.model.ts) | Rendering element factory. |
| stickyMap | [IVirtualListStickyMap?](https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/sticky-map.model.ts) | Dictionary zIndex by id of the list element. If the value is not set or equal to 0, then a simple element is displayed, if the value is greater than 0, then the sticky position mode is enabled for the element. |
| snap | boolean? = false | Determines whether elements will snap. Default value is "false". |
| snappingMethod | [SnappingMethod? = 'normal'](https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/enums/snapping-method.ts) | Snapping method. 'normal' - Normal group rendering. 'advanced' - The group is rendered on a transparent background. List items below the group are not rendered. |
| direction | [Direction? = 'vertical'](https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/enums/direction.ts) | Determines the direction in which elements are placed. Default value is "vertical". |
| dynamicSize | boolean? = false | If true then the items in the list can have different sizes and the itemSize property is ignored. If false then the items in the list have a fixed size specified by the itemSize property. The default value is false. |
| enabledBufferOptimization | boolean? = true | Experimental! Enables buffer optimization. Can only be used if items in the collection are not added or updated. |
| trackBy | string? = 'id' | The name of the property by which tracking is performed. |

<br/>

Outputs

| Event | Type | Description |
|---|---|---|
| onItemClick | [IRenderVirtualListItem](https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/render-item.model.ts) \| undefined | Fires when an element is clicked. |
| onScroll | ([IScrollEvent](https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/scroll-event.model.ts)) => void | Fires when the list has been scrolled. |
| onScrollEnd | ([IScrollEvent](https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/models/scroll-event.model.ts)) => void | Fires when the list has completed scrolling. |
| onViewportChange | [ISize](https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/types/size.ts) | Fires when the viewport size is changed. |

<br/>

Methods

| Method | Type | Description |
|--|--|--|
| scrollTo | (id: [Id](https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/types/id.ts), behavior: ScrollBehavior = 'auto') => number | The method scrolls the list to the element with the given id and returns the value of the scrolled area. Behavior accepts the values ​​"auto", "instant" and "smooth". |
| scrollToEnd | (behavior?: ScrollBehavior) => void | Scrolls the scroll area to the desired element with the specified ID. |
| getItemBounds | (id: [Id](https://github.com/DjonnyX/rcx-virtual-list/tree/main/src/lib/src/types/id.ts), behavior?: ScrollBehavior) => void | Returns the bounds of an element with a given id |

<br/>

## License

MIT License

Copyright (c) 2025 djonnyx (Evgenii Grebennikov)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
