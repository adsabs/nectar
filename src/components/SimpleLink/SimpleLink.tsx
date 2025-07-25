import { AnchorHTMLAttributes, forwardRef, PropsWithChildren, ReactElement, ReactNode, Ref } from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { UrlObject } from 'url';

export interface ISimpleLinkProps extends Omit<NextLinkProps, 'href'> {
  href: string | UrlObject;
  newTab?: boolean;
  icon?: ReactElement;
  className?: string;
  anchorProps?: AnchorHTMLAttributes<HTMLAnchorElement>;
  children?: ReactNode;
}

export const SimpleLink = forwardRef(
  (props: PropsWithChildren<ISimpleLinkProps>, ref: Ref<HTMLAnchorElement>): ReactElement => {
    const { children, icon, prefetch = false, newTab, className, href, anchorProps, ...rest } = props;
    const isExternal = isHrefExternal(href);

    return (
      <NextLink href={href} prefetch={prefetch} passHref {...rest} legacyBehavior>
        <a
          ref={ref}
          className={className}
          target={newTab || isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener' : undefined}
          {...anchorProps}
        >
          {icon && <>{icon}</>}
          {children}
        </a>
      </NextLink>
    );
  },
);

SimpleLink.displayName = 'SimpleLink';

function isHrefExternal(href: string | UrlObject): boolean {
  if (typeof href === 'string') {
    return /^https?:/.test(href);
  }
  return typeof href.protocol === 'string' && /^https?:/.test(href.protocol);
}
