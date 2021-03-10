import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import React, { ReactElement, ReactNode, useCallback, useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import { usePopper } from 'react-popper';

export interface IDropdownBasicProps {
  label: ReactNode;
  classes: {
    button?: string;
    container?: string;
  };
  offset: [number, number];
  children: ReactNode;
}

export const DropdownBasic = (props: IDropdownBasicProps): ReactElement => {
  const { label, classes, offset, children } = props;
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

  const handleOutsideClick = () => {
    setVisible(false);
  };

  const containerClasses = clsx(classes.container, {
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
        className={containerClasses}
      >
        {children}
      </div>
    </OutsideClickHandler>
  );
};
