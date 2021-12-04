import { ChevronDownIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import { ReactElement, ReactNode, useCallback, useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import { usePopper } from 'react-popper';

export interface IDropdownBaseProps {
  label: ReactNode;
  renderButton({ ref }: { ref(): HTMLButtonElement | undefined }): ReactNode;
  classes: {
    button?: string;
    container?: string;
  };
  offset: [number, number];
  children: ReactNode;
}

export const DropdownBase = ({ label, classes, offset, children, renderButton }: IDropdownBaseProps): ReactElement => {
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

  const containerClasses = clsx('z-50 bg-white', classes.container, {
    hidden: !visible,
  });

  return (
    <OutsideClickHandler onOutsideClick={handleOutsideClick}>
      {renderButton({ ref: () => referenceElement })}
      <button type="button" ref={targetRef} className={classes.button} onClick={handleClick}>
        {label} <ChevronDownIcon className="inline w-4 h-4" aria-hidden="true" />
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
