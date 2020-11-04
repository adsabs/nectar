import clsx from 'clsx';
import React, { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

export interface IButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  fullWidth?: boolean;
}

const Button: React.FC<IButtonProps> = (props) => {
  const { fullWidth, ...buttonProps } = props;

  const cls = clsx(
    {
      'w-full': fullWidth,
      'mr-1': !fullWidth,
    },
    'bg-blue-500 text-white active:bg-blue-500 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mb-1'
  );

  return (
    <button
      {...buttonProps}
      className={cls}
      type="button"
      style={{ transition: 'all .15s ease' }}
    >
      {props.children}
    </button>
  );
};

export default Button;
