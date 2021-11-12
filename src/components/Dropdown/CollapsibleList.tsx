import { ChevronDownIcon } from '@heroicons/react/solid';
import { isBrowser } from '@utils';
import clsx from 'clsx';
import { KeyboardEvent, ReactElement, ReactNode, useEffect, useState } from 'react';
import { Item } from './ListItem';
import { ItemType } from './types';

export interface ICollapsibleListProps {
  label: ReactNode | string;
  items: ItemType[];
  onSelect: (id: ItemType['id']) => void;
  onExpanded?: () => void; // list expanded
  onCollapsed?: () => void; // list collapsed
  onEscaped: () => void;
  classes: {
    button: string;
    item?: string;
  };
  role: string;
  itemRole: string;
  ariaLabel?: string;
  reset: boolean;
}

export const CollapsibleList = (props: ICollapsibleListProps): ReactElement => {
  const { label, items, classes, onSelect, onExpanded, onCollapsed, onEscaped, role, itemRole, ariaLabel, reset } =
    props;

  const [visible, setVisible] = useState<boolean>(!closed);

  const labelElement =
    typeof label === 'string' ? (
      <>
        {label} <ChevronDownIcon className="inline w-4 h-4" />
      </>
    ) : (
      label
    );

  const collapse = () => setVisible(false);

  useEffect(() => (visible ? onExpanded() : onCollapsed()), [visible]);

  useEffect(() => {
    if (reset) {
      setVisible(false);
    }
  }, [reset]);

  // click on label, toggle list visibility
  const handleClick = () => {
    setVisible(!visible);
  };

  // key down on label
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case 'Space':
      case ' ':
        e.preventDefault();
        setVisible(!visible);
        return;
      case 'Escape':
        collapse();
        return onEscaped();
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
        return onEscaped();
    }
  };

  const focusItem = (index: number) => {
    const numItems = items.length;
    const idx = index >= numItems ? 0 : index < 0 ? numItems - 1 : index;
    if (isBrowser()) {
      document.getElementById(`${items[idx].domId}`).focus();
    }
  };

  const handleSelect = (item: ItemType) => {
    onSelect(item.id);
    collapse();
  };

  return (
    <>
      <button
        type="button"
        className={classes.button}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-expanded={visible}
      >
        {labelElement}
      </button>
      <div className={clsx(visible && !reset ? '' : 'hidden', 'flex flex-col')} role={role}>
        {items.map((item, index) => (
          <Item
            key={item.id}
            item={item}
            tabIndex={0}
            onClick={() => handleSelect(item)}
            onKeyDown={(e) => handleItemKeyDown(e, item, index)}
            classes={classes.item}
            role={itemRole}
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
  onEscaped: () => undefined,
  classes: {},
  role: 'menu',
  ariaLabel: null,
};
