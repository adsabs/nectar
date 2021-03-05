import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import React, {
  HTMLAttributes,
  ReactElement,
  ReactNode,
  useCallback,
  useState,
} from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import { usePopper } from 'react-popper';

export type ItemType = {
  id: string;
  label?: string;
  element?: ReactNode;
};

export interface IDropdownProps {
  label: string;
  items: ItemType[];
  onSelect: (id: ItemType['id']) => void;
  classes: {
    button: string;
  };
  offset: [number, number];
}

export const Dropdown = (props: IDropdownProps): ReactElement => {
  const { label, items, classes, onSelect, offset } = props;
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement>();
  const [visible, setVisible] = useState<boolean>(true);

  const targetRef = useCallback((node) => {
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
    placement: 'bottom',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset,
        },
      },
    ],
  });

  const handleClick = () => {
    setVisible(!visible);
  };

  const handleSelect = useCallback(
    (item: ItemType) => {
      return () => {
        onSelect(item.id);
      };
    },
    [onSelect],
  );

  const handleOutsideClick = () => {
    setVisible(false);
  };

  const popperClasses = clsx('border divide-y flex flex-col', {
    hidden: !visible,
  });

  return (
    <OutsideClickHandler onOutsideClick={handleOutsideClick}>
      <button
        type="button"
        ref={targetRef}
        className={classes.button}
        onClick={handleClick}
      >
        {label} <FontAwesomeIcon icon={faCaretDown} />
      </button>
      <div
        ref={popperRef}
        style={{ ...styles.popper, minWidth: '10rem' }}
        {...attributes.popper}
        className={popperClasses}
      >
        {items.map((item) => (
          <Item key={item.id} item={item} onClick={handleSelect(item)} />
        ))}
      </div>
    </OutsideClickHandler>
  );
};

Dropdown.defaultProps = {
  label: 'BUTTON',
  items: [],
  onSelect: null,
  classes: {},
  offset: [0, 15],
};

interface IItemProps
  extends HTMLAttributes<HTMLButtonElement | HTMLDivElement> {
  item: ItemType;
}
const Item = (props: IItemProps): ReactElement => {
  const {
    item: { label, element },
    ...restProps
  } = props;
  const itemClasses = clsx('px-3 text-left hover:bg-gray-100 py-2');

  if (element) {
    return <div className={itemClasses}>{element}</div>;
  }
  return (
    <button className={itemClasses} type="button" {...restProps}>
      {label}
    </button>
  );
};
