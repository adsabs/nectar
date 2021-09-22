import { ChevronDownIcon } from '@heroicons/react/solid';
import { Placement } from '@popperjs/core';
import { isBrowser } from '@utils';
import clsx from 'clsx';
import React, { KeyboardEvent, ReactElement, ReactNode, useCallback, useEffect, useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import { usePopper } from 'react-popper';
import { Item } from './ListItem';
import { ItemType } from './types';
export interface IDropdownListProps {
  label: ReactNode | string;
  items: ItemType[];
  onSelect: (id: ItemType['id']) => void;
  onExpanded?: () => void;
  onClosed?: () => void;
  classes: {
    button: string;
    list: string;
  };
  offset?: [number, number];
  placement?: Placement;
  role: string;
  ariaLabel?: string;
}

export const DropdownList = (props: IDropdownListProps): ReactElement => {
  const { label, items, classes, onSelect, onExpanded, onClosed, offset, role, ariaLabel } = props;
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement>();
  const [visible, setVisible] = useState<boolean>(false);

  const labelElement =
    typeof label === 'string' ? (
      <>
        {label} <ChevronDownIcon className="default-icon-sm inline" />
      </>
    ) : (
      label
    );

  useEffect(() => (visible ? onExpanded() : onClosed()), [visible]);

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
    const idx = index >= numItems ? 0 : index < 0 ? numItems - 1 : index;
    if (isBrowser()) {
      document.getElementById(`${items[idx].domId}`).focus();
    }
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
        {labelElement}
      </button>
      <div ref={popperRef} style={{ ...styles.popper }} {...attributes.popper} className={popperClasses}>
        {items.map((item, index) => (
          <Item
            key={item.id}
            item={item}
            tabIndex={0}
            onClick={() => handleSelect(item)}
            onKeyDown={(e) => handleItemKeyDown(e, item, index)}
            classes={clsx(item.disabled ? 'cursor-default' : 'hover:bg-gray-100', item.classes)}
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
  onSelect: () => undefined,
  onExpanded: () => undefined,
  onClosed: () => undefined,
  classes: {},
  offset: [0, 15],
  placement: 'bottom',
  role: 'menu',
  ariaLabel: null,
};
