import { ChevronDownIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import React, { HTMLAttributes, ReactElement, useEffect, useState, KeyboardEvent, ReactNode } from 'react';
import { ItemType } from './types';

export interface ICollapsibleListProps {
  label: ReactNode;
  useCustomLabel: boolean;
  items: ItemType[];
  onSelect: (id: ItemType['id']) => void;
  onExpanded?: () => void;
  onCollapsed?: () => void;
  onClose: () => void;
  classes: {
    button: string;
    item?: string;
  };
  role: string;
  ariaLabel?: string;
  reset: boolean;
}

export const CollapsibleList = (props: ICollapsibleListProps): ReactElement => {
  const { label, useCustomLabel, items, classes, onSelect, onExpanded, onCollapsed, onClose, role, ariaLabel, reset } = props;

  const [visible, setVisible] = useState<boolean>(!closed);

  const collapse = () => setVisible(false);

  const expand = () => setVisible(true);

  useEffect(() => (visible ? onExpanded() : onCollapsed()), [visible]);

  useEffect(() => {
    if (reset) {
      setVisible(false);
    }
  }, [reset]);

  const handleClick = () => {
    setVisible(!visible);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case 'Space':
      case ' ':
        e.preventDefault();
        handleClick();
        return;
      case 'ArrowUp':
        e.preventDefault();
        // TODO 
        return;
      case 'ArrowDown':
        e.preventDefault();
        // TODO
        return;
      case 'Escape':
        collapse();
        return onClose();
    }
  };

  const handleItemKeyDown = (e: KeyboardEvent, item: ItemType, index: number) => {
    switch (e.key) {
      case 'Enter':
      case 'Space':
        e.preventDefault();
        handleSelect(item);
        return;
      case 'ArrowUp':
        e.preventDefault();
        focusItem(index - 1);
        return;
      case 'ArrowDown':
        e.preventDefault();
        focusItem(index + 1);
        return;
      case 'Escape':
        collapse();
        return onClose();
    }
  };

  const focusItem = (index: number) => {
    const numItems = items.length;
    const idx = index >= numItems ? 0 : index < 0 ? numItems - 1 : index;
    if (typeof window !== 'undefined') document.getElementById(`${items[idx].domId}`).focus();
  };

  const handleSelect = (item: ItemType) => {
    onSelect(item.id);
    collapse();
  };

  return (
    <>
      <button
        type="button"
        role={role}
        className={classes.button}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-expanded={visible}
      >
        {useCustomLabel ? (
          label
        ) : (
          <>
            {label} <ChevronDownIcon className="inline w-4 h-4" />
          </>
        )}
      </button>
      <div className={clsx(visible && !reset? '' : 'hidden', 'flex flex-col')}>
        {items.map((item, index) => (
          <Item
            key={item.id}
            item={item}
            tabIndex={0}
            onClick={() => handleSelect(item)}
            onKeyDown={(e) => handleItemKeyDown(e, item, index)}
            classes={classes.item}
          />
        ))}
      </div>
    </>
  );
};

CollapsibleList.defaultProps = {
  label: 'BUTTON',
  items: [],
  currentItem: null,
  onSelect: null,
  onExpanded: () => undefined,
  onCollapsed: () => undefined,
  onClose: () => undefined,
  classes: {},
  role: 'menu',
  ariaLabel: null,
};

interface IItemProps extends HTMLAttributes<HTMLButtonElement | HTMLDivElement> {
  item: ItemType;
  classes: string;
}

const Item = (props: IItemProps): ReactElement => {
  const {
    item: { domId, label },
    classes,
    ...restProps
  } = props;
  const itemClasses = clsx(classes, 'px-3 py-2 text-left');

  return (
    <button className={itemClasses} type="button" {...restProps} id={domId}>
      {label}
    </button>
  );
};
