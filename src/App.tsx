import React, { ChangeEvent, useCallback, useRef, useState } from 'react';
import { Id, IVirtualListCollection, IVirtualListItem, IVirtualListStickyMap, VirtualList } from './lib/src';
import './lib/index.css';
import './App.scss';
import { LOGO } from './const';
import { VirtualListItemRenderer } from './lib/src/models';

const MAX_ITEMS = 10000;

const ITEMS: IVirtualListCollection = [];
for (let i = 0, l = MAX_ITEMS; i < l; i++) {
  const id = i + 1;
  ITEMS.push({ id, name: `Item: ${id}` });
}

const HORIZONTAL_ITEMS: IVirtualListCollection = [];
for (let i = 0, l = MAX_ITEMS; i < l; i++) {
  const id = i + 1;
  HORIZONTAL_ITEMS.push({ id, name: `${id}` });
}

const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E'];

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

const GROUP_ITEMS: IVirtualListCollection = [],
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

const CHARS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

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
  GROUP_DYNAMIC_ITEMS_STICKY_MAP: IVirtualListStickyMap = {},
  GROUP_DYNAMIC_ITEMS_WITH_SNAP: IVirtualListCollection = [],
  GROUP_DYNAMIC_ITEMS_STICKY_MAP_WITH_SNAP: IVirtualListStickyMap = {};

let groupDynamicIndex = 0;
for (let i = 0, l = 100000; i < l; i++) {
  const id = i + 1, type = i === 0 || Math.random() > .895 ? 'group-header' : 'item';
  if (type === 'group-header') {
    groupDynamicIndex++;
  }
  GROUP_DYNAMIC_ITEMS.push({ id, type, name: type === 'group-header' ? `Group ${id}. ${generateText()}` : `${id}. ${generateText()}` });
  GROUP_DYNAMIC_ITEMS_STICKY_MAP[id] = type === 'group-header' ? 1 : 0;
  GROUP_DYNAMIC_ITEMS_WITH_SNAP.push({ id, type, name: type === 'group-header' ? `Group ${id}` : `${id}. ${generateText()}` });
  GROUP_DYNAMIC_ITEMS_STICKY_MAP_WITH_SNAP[id] = type === 'group-header' ? 1 : 0;
}

const itemRendererFactory = (onItemClick: (data: IVirtualListItem) => any): VirtualListItemRenderer => (({ data, config }) => {
  if (!data) {
    return null;
  }

  return <div className="list__container" onClick={onItemClick(data)}>{data?.name}</div>
});

const horizontalItemRendererFactory = (onItemClick: (data: IVirtualListItem) => any): VirtualListItemRenderer => (({ data, config }) => {
  if (!data) {
    return null;
  }

  return <div className="list__h-container" onClick={onItemClick(data)}>{data?.name}</div>
});

const horizontalGroupItemRendererFactory = (onItemClick: (data: IVirtualListItem) => any): VirtualListItemRenderer => (({ data, config }) => {
  if (!data) {
    return null;
  }

  switch (data['type']) {
    case 'group-header': {
      return <div className="list__h-group-container">{data?.name}</div>
    }
    case 'item': {
      return <div className="list__h-container" onClick={onItemClick(data)}>{data?.name}</div>
    }
  }
  return null;
});

const groupItemRendererFactory = (onItemClick: (data: IVirtualListItem) => any): VirtualListItemRenderer => (({ data, config }) => {
  if (!data) {
    return null;
  }

  switch (data['type']) {
    case 'group-header': {
      return <div className="list__group-container">{data?.name}</div>
    }
    case 'item': {
      return <div className="list__container" onClick={onItemClick(data)}>{data?.name}</div>
    }
  }

  return null;
});

function App() {
  const [verticalItems] = useState([...ITEMS]);
  const [verticalItems1] = useState([...ITEMS]);
  const [horizontalItems] = useState([...HORIZONTAL_ITEMS]);
  const [horizontalGroupItems] = useState([...HORIZONTAL_GROUP_ITEMS]);
  const [horizontalGroupItemsStickyMap] = useState({ ...HORIZONTAL_GROUP_ITEMS_STICKY_MAP });
  const [groupItems] = useState([...GROUP_ITEMS]);
  const [groupItemsStickyMap] = useState({ ...GROUP_ITEMS_STICKY_MAP });
  const [groupItems1] = useState([...GROUP_ITEMS]);
  const [groupItemsStickyMap1] = useState({ ...GROUP_ITEMS_STICKY_MAP });
  const [groupDynamicItems] = useState([...GROUP_DYNAMIC_ITEMS]);
  const [groupDynamicItemsStickyMap] = useState({ ...GROUP_DYNAMIC_ITEMS_STICKY_MAP });

  const [minId] = useState<Id>(() => {
    return verticalItems1.length > 0 ? verticalItems1[0].id : 0;
  });
  const [maxId] = useState<Id>(() => {
    return verticalItems1.length > 0 ? verticalItems1[verticalItems1.length - 1].id : 0;
  });
  const itemId = useRef<Id>(minId);
  const $listContainerRef = useRef<VirtualList>(null);

  const [minDlId] = useState<Id>(() => {
    return verticalItems1.length > 0 ? verticalItems1[0].id : 0;
  });
  const [maxDlId] = useState<Id>(() => {
    return verticalItems1.length > 0 ? verticalItems1[verticalItems1.length - 1].id : 0;
  });
  const itemDlId = useRef<Id>(minId);
  const $listContainerRef1 = useRef<VirtualList>(null);

  const onButtonScrollToIdClickHandler = () => {
    const list = $listContainerRef.current;
    if (list && itemId && itemId.current !== undefined) {
      list.scrollTo(itemId.current, 'smooth' as ScrollBehavior);
    }
  };

  const onButtonScrollDLToIdClickHandler = () => {
    const list = $listContainerRef1.current;
    if (list && itemDlId && itemDlId.current !== undefined) {
      list.scrollTo(itemDlId.current, 'smooth' as ScrollBehavior);
    }
  };

  const onInputScrollToIdChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const id: Id | undefined = Number((e.target as any)?.value);
    if (id) {
      itemId.current = id;
    }
  }, []);

  const onInputScrollToDlIdChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const id: Id | undefined = Number((e.target as any)?.value);
    if (id) {
      itemDlId.current = id;
    }
  }, []);

  const onItemClick = (data: IVirtualListItem) => () => {
    console.info(`Click: Item ${data['name']} (ID: ${data.id})`);
  };

  return (
    <div className="wrapper">
      <div className="vl-section block cap">
        <h1 className="center">rcx-virtual-list</h1>
        <p className="l">Maximum performance for extremely large lists</p>
        <p className="l">Animation of elements is supported.</p>
        <p className="l m">&#64;author: djonnyx&#64;gmail.com</p>
        <p className="l m">Port of <a href='https://github.com/DjonnyX/ng-virtual-list/tree/main/projects/ng-virtual-list'>ng-virtual-list</a></p>
        <img className="logo" src={LOGO} />
        <div className="version"><span>v 1.0.9</span></div>
        <div className="version"><span>React v 16.X.X - v 19.X.X</span></div>
      </div>

      <div className="vl-section">
        <div className="vl-section__container">
          <h2>Horizontal list</h2>
          <VirtualList className="list" direction="hotizontal" itemRenderer={horizontalItemRendererFactory(onItemClick)} items={horizontalItems}
            itemSize={54} itemsOffset={50} />
        </div>
      </div>

      <div className="vl-section">
        <div className="vl-section__container">
          <h2>Horizontal group list</h2>
          <VirtualList className="list" direction="hotizontal" itemRenderer={horizontalGroupItemRendererFactory(onItemClick)}
            items={horizontalGroupItems} itemSize={54} itemsOffset={50} snap={true} stickyMap={horizontalGroupItemsStickyMap} />
        </div>
      </div>

      <div className="vl-section">
        <div className="vl-section__container">
          <h2>Vertical virtual list</h2>
          <VirtualList className="list" direction="vertical" itemRenderer={itemRendererFactory(onItemClick)}
            items={verticalItems} itemSize={40} itemsOffset={50} />
        </div>
      </div>

      <div className="vl-section">
        <div className="vl-section__container">
          <h2>Scroll to item</h2>
          <div className="scroll-to__controls">
            <input type={'number'} className="scroll-to__input" required={true} min={minId}
              max={maxId} onChange={onInputScrollToIdChangeHandler} />
            <button className="scroll-to__button" onClick={onButtonScrollToIdClickHandler}>Scroll</button>
          </div>
          <VirtualList ref={$listContainerRef} className="list" direction="vertical" itemRenderer={itemRendererFactory(onItemClick)}
            items={verticalItems1} itemSize={40} itemsOffset={50} />
        </div>
      </div>

      <div className="vl-section">
        <div className="vl-section__container">
          <h2>Virtual group list</h2>
          <VirtualList className="list" items={groupItems} itemRenderer={groupItemRendererFactory(onItemClick)} itemsOffset={50}
            stickyMap={groupItemsStickyMap} itemSize={40} />
        </div>
      </div>

      <div className="vl-section">
        <div className="vl-section__container">
          <h2>Virtual group list (with snapping)</h2>
          <VirtualList className="list" items={groupItems1} itemRenderer={groupItemRendererFactory(onItemClick)} itemsOffset={50}
            stickyMap={groupItemsStickyMap1} itemSize={40} snap={true} />
        </div>
      </div>

      <div className="vl-section">
        <div className="vl-section__container">
          <h2>Virtual list (with dynamic item size)</h2>
          <div className="scroll-to__controls">
            <input type="number" className="scroll-to__input" required={true} min={minDlId}
              max={maxDlId} onChange={onInputScrollToDlIdChangeHandler} />
            <button className="scroll-to__button" onClick={onButtonScrollDLToIdClickHandler}>Scroll</button>
          </div>
          <VirtualList ref={$listContainerRef1} className="list" items={groupDynamicItems} itemRenderer={groupItemRendererFactory(onItemClick)}
            itemsOffset={50} stickyMap={groupDynamicItemsStickyMap} dynamicSize={true} snap={true} />
        </div>
      </div >

    </div >
  );
}

export default App;
