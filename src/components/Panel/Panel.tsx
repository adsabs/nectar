import { XIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import PT from 'prop-types';
import { FC, HTMLAttributes, ReactChild, useMemo } from 'react';

export interface IPanelProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactChild;
  label?: string;
  ariaName: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const propTypes = {
  children: PT.element,
  label: PT.string,
  onClose: PT.func,
  showCloseButton: PT.bool,
};

const defaultProps = {
  showCloseButton: false,
};

export const Panel: FC<IPanelProps> = ({ children, label, ariaName, onClose, showCloseButton, ...restProps }) => {
  const classes = {
    root: 'bg-white divide-gray-200 rounded-lg shadow',
    title: clsx({ 'px-4 py-3 sm:px-6 flex justify-between': label }),
    body: 'px-4 py-5 sm:p-6 h-full',
  };

  const ariaLabel = useMemo(() => ariaName.replace(/\W+/g, '-').toLowerCase(), [ariaName]);

  return (
    <section className={classes.root} aria-labelledby={`${ariaLabel}-menu-title`} {...restProps}>
      <div className={classes.title}>
        {label && (
          <h2 className="text-lg" id={`${ariaLabel}-menu-title`}>
            {label}
          </h2>
        )}
        {showCloseButton && (
          <button title={`close ${ariaLabel} menu`} onClick={onClose}>
            <span className="sr-only">{`close ${ariaLabel} menu`}</span>
            <XIcon className="w-5 h-5 opacity-50" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className={classes.body}>{children}</div>
    </section>
  );
};

Panel.propTypes = propTypes;
Panel.defaultProps = defaultProps;
