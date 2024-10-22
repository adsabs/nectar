import { forwardRef, PropsWithChildren, ReactElement, Ref } from 'react';
import { Url } from 'next/dist/shared/lib/router/router';
import { Link, LinkProps } from '@chakra-ui/next-js';

export interface ISimpleLinkProps extends LinkProps {
  newTab?: boolean;
  icon?: ReactElement;
}

export const SimpleLink = forwardRef(
  (props: PropsWithChildren<ISimpleLinkProps>, ref: Ref<HTMLAnchorElement>): ReactElement => {
    const { children, icon, variant = 'default', prefetch = false, newTab, ...linkProps } = props;
    const isExternal = isHrefExternal(linkProps.href, linkProps.isExternal);

    return (
      <Link
        ref={ref}
        variant={variant}
        isExternal={isExternal}
        prefetch={prefetch}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        target={typeof newTab === 'boolean' && newTab ? '_blank' : linkProps.target}
        {...linkProps}
      >
        {icon && <>{icon}</>}
        {children}
      </Link>
    );
  },
);
SimpleLink.displayName = 'SimpleLink';

const isHrefExternal = (href: Url, isExternal?: boolean): boolean =>
  isExternal ?? /^https?:/.test(typeof href === 'string' ? href : href.protocol);
