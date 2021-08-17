import { ChevronDownIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import React, { HTMLAttributes, ReactElement, ReactNode, useCallback, useState, KeyboardEvent } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import { usePopper } from 'react-popper';
import { Placement } from '@popperjs/core';
import { useEffect } from 'react';

export type ItemType = {
  id: string;
  label?: string;
  path?: string;
  domId: string;
};

export interface IDropdownListProps {
  label: ReactNode;
  items: ItemType[];
  onSelect: (id: ItemType['id']) => void;
  onExpanded?: () => void;
  onClosed?: () => void;
  classes: {
    button: string;
    list: string;
  };
  offset?: [number, number];
  useCustomLabel: boolean;
  placement?: Placement;
  role: string;
  ariaLabel?: string;
}

export const DropdownList = (props: IDropdownListProps): ReactElement => {
  const { label, items, classes, onSelect, onExpanded, onClosed, offset, useCustomLabel, role, ariaLabel } = props;
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement>();
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => (visible? onExpanded() : onClosed()), [visible]);

  const targetRef = useCallback((node: HTMLButtonElement) => {
    if (node !== null) {
      setReferenceElement(node);
    }
  }, []);

  const popperRef = useCallback((node) => {
    if (node !== null) {
      setPopperElement(node);
    }
  }, []);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: props.placement,
    modifiers: [
      {
        name: 'offset',
        options: {
          offset,
        },
      },
    ],
  });

  const close = () => setVisible(false);

  const open = () => setVisible(true);

  /* Click on dropdown */
  const handleClick = () => setVisible(!visible);

  /* keydown on dropdown */
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case 'Space':
        e.preventDefault();
        handleClick();
        return;
      case 'Escape':
        close();
        return;
      case 'ArrowDown':
        e.preventDefault();
        open();
        focusItem(0);
        return;
    }
  };

  /* selected item */
  const handleSelect = (item: ItemType) => {
    onSelect(item.id);
    close();    
  };

  /* keydown on item */
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
      case 'Tab':
        return close();
    }
  };

  const focusItem = (index: number) => {
    const numItems = items.length;
    const idx = index >= numItems? 0 : index < 0? numItems - 1 : index;
    if (typeof window !== 'undefined')
      document.getElementById(`${items[idx].domId}`).focus();
  };

  const handleOutsideClick = () => {
    close();
  };

  const popperClasses = clsx(classes.list, 'z-50 flex flex-col bg-white border divide-y', {
    hidden: !visible,
  });

  return (
    <OutsideClickHandler onOutsideClick={handleOutsideClick}>
      <button
        type="button"
        ref={targetRef}
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
      <div
        ref={popperRef}
        style={{ ...styles.popper}}
        {...attributes.popper}
        className={popperClasses}
      >
        {items.map((item, index) => (
          <Item
            key={item.id}
            item={item}
            tabIndex={0}
            onClick={() => handleSelect(item)}
            onKeyDown={(e) => handleItemKeyDown(e, item, index)}
          />
        ))}
      </div>
    </OutsideClickHandler>
  );
};

DropdownList.defaultProps = {
  label: 'BUTTON',
  items: [],
  currentItem: null,
  onSelect: null,
  onExpanded: () => undefined,
  onClosed: () => undefined,
  classes: {},
  offset: [0, 15],
  placement: 'bottom',
  role: 'menu',
  ariaLabel: null,
};

interface IItemProps extends HTMLAttributes<HTMLButtonElement | HTMLDivElement> {
  item: ItemType;
}
const Item = (props: IItemProps): ReactElement => {
  const {
    item: { domId, label },
    ...restProps
  } = props;
  const itemClasses = clsx('px-3 py-2 text-left hover:bg-gray-100');

  return (
    <button className={itemClasses} type="button" {...restProps} id={domId}>
      {label}
    </button>
  );
};
