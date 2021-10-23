import clsx from 'clsx';
import { ButtonHTMLAttributes, DetailedHTMLProps, FC } from 'react';

enum ButtonVariant {
  PRIMARY = 'primary',
  LINK = 'link',
}

enum ButtonSize {
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
}

export interface IButtonProps extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  variant?: `${ButtonVariant}`;
  size?: `${ButtonSize}`;
}

export const Button: FC<IButtonProps> = ({ size, variant, ...props }) => {
  const styles = clsx(props.className, {
    // default styles (except for link)
    'inline-flex items-center justify-center font-medium border': variant !== 'link',
    'focus:outline-none focus:ring-indigo-500 focus:ring-offset-2 focus:ring-2': variant !== 'link',

    // variants
    'text-white bg-blue-600 border-blue-600 hover:bg-blue-500 focus:border-white focus:outline-none focus:ring-blue-900 focus:ring-1':
      variant === ButtonVariant.PRIMARY,
    'inline-flex items-center justify-start text-blue-600 hover:underline': variant === ButtonVariant.LINK,

    // size
    'px-2.5 py-1.5 text-xs rounded': size === ButtonSize.XS,
    'px-3 py-2 leading-4 text-sm rounded-md': size === ButtonSize.SM,
    'px-4 py-2 text-sm rounded-md': size === ButtonSize.MD,
    'px-4 py-2 text-base rounded-md': size === ButtonSize.LG,
    'px-6 py-3 text-base rounded-md': size === ButtonSize.XL,
  });
  return <button type="button" {...props} className={styles}></button>;
};

Button.defaultProps = {
  variant: ButtonVariant.PRIMARY,
  size: ButtonSize.SM,
};
