import { PropsWithChildren, ReactElement } from 'react';
import { Url } from 'next/dist/shared/lib/router/router';
import { Link, LinkProps } from '@chakra-ui/next-js';

export interface ISimpleLinkProps extends LinkProps {
  newTab?: boolean;
  icon?: ReactElement;
}

export const SimpleLink = (props: PropsWithChildren<ISimpleLinkProps>): ReactElement => {
  const { children, icon, variant = 'default', prefetch = false, newTab, ...linkProps } = props;
  const isExternal = isHrefExternal(linkProps.href, linkProps.isExternal);

  return (
    <Link
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
};

const isHrefExternal = (href: Url, isExternal?: boolean): boolean =>
  isExternal ?? /^https?/.test(typeof href === 'string' ? href : href.protocol);
