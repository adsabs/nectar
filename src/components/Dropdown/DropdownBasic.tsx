import { ChevronDownIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import React, { ReactElement, ReactNode, useCallback, useState, KeyboardEvent} from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import { usePopper } from 'react-popper';

export interface IDropdownBasicProps {
  label: ReactNode;
  classes?: {
    button?: string;
    container?: string;
  };
  offset?: [number, number];
  children?: ReactNode;
  role?: string;
}

export const DropdownBasic = (props: IDropdownBasicProps): ReactElement => {
  const { label, classes = {}, offset = [0, 0], children, role } = props;
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement>();
  const [visible, setVisible] = useState<boolean>(false);

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
    placement: 'bottom-start',
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

  const handleOutsideClick = () => {
    setVisible(false);
  };

  const open = () => {
    visible || setVisible(true);
  }

  const close = () => {
    !visible || setVisible(false);
  }

  /* keydown on dropdown */
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleClick();
        return;
      case 'Space':
        handleClick();
        return;
      case 'Escape':
        close();
        return;
      case 'ArrowDown':
        open();
        popperElement.focus();
        return;
      default:
        return;
    }
  };

  const handleChildrenKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        close();
        return;
      default:
        return;
    }
  }

  const containerClasses = clsx('z-50 bg-white focus:border-blue-700', classes.container, {
    hidden: !visible,
  });

  return (
    <OutsideClickHandler onOutsideClick={handleOutsideClick}>
      <button
        type="button"
        ref={targetRef}
        className={classes.button}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={role}
      >
        {label} <ChevronDownIcon className="inline w-4 h-4" />
      </button>
      <div
        ref={popperRef}
        style={{ ...styles.popper, minWidth: '10rem' }}
        {...attributes.popper}
        className={containerClasses}
        tabIndex={0}
        onKeyDown={handleChildrenKeydown}
      >
        {children}
      </div>
    </OutsideClickHandler>
  );
};
