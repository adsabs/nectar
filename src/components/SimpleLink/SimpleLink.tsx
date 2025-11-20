import { forwardRef, PropsWithChildren, ReactElement, ReactNode, Ref } from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { UrlObject } from 'url';
import { chakra, LinkProps as ChakraLinkProps } from '@chakra-ui/react';

export interface ISimpleLinkProps extends NextLinkProps, Omit<ChakraLinkProps, 'as' | 'href'> {
  newTab?: boolean;
  icon?: ReactElement;
  children?: ReactNode;
}

export const SimpleLink = forwardRef(
  (props: PropsWithChildren<ISimpleLinkProps>, ref: Ref<HTMLAnchorElement>): ReactElement => {
    const {
      children,
      icon,
      prefetch = false,
      newTab,
      href,
      onNavigate,
      onClick,
      onTouchStart,
      onMouseEnter,
      locale,
      legacyBehavior = true,
      passHref = true,
      shallow,
      scroll,
      replace,
      as,
      ...rest
    } = props;
    const isExternal = isHrefExternal(href);

    return (
      <NextLink
        href={href}
        prefetch={prefetch}
        passHref={passHref}
        onTouchStart={onTouchStart}
        onMouseEnter={onMouseEnter}
        onNavigate={onNavigate}
        locale={locale}
        shallow={shallow}
        scroll={scroll}
        replace={replace}
        as={as}
        legacyBehavior={legacyBehavior}
      >
        <chakra.a
          ref={ref}
          onClick={onClick}
          target={newTab || isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener' : undefined}
          {...rest}
        >
          {icon && <>{icon}</>}
          {children}
        </chakra.a>
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
