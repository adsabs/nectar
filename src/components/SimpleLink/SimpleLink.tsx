import { Link, LinkProps } from '@chakra-ui/react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { ReactNode } from 'react';
import { isPlainObject } from 'ramda-adjunct';

interface INextLinkAsOverrideProps extends Omit<NextLinkProps, 'as'> {
  nextAs: NextLinkProps['as'];
}
const NextLinkAsOverride = (props: INextLinkAsOverrideProps) => <NextLink {...props} as={props.nextAs} />;

export type SimpleLinkProps = Omit<LinkProps, 'href' | 'as'> & NextLinkProps & { icon?: ReactNode; newTab?: boolean };

export const SimpleLink = (props: SimpleLinkProps) => {
  const { children, as, href, icon, newTab, variant = 'default', ...linkProps } = props;

  const hrefStr = isPlainObject(href) ? href.href : href;
  const isExternal = newTab || hrefStr.startsWith('http');

  return (
    <Link
      as={NextLinkAsOverride}
      nextAs={as}
      href={hrefStr}
      variant={variant}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      {...linkProps}
    >
      {icon ? (
        <>
          {icon}
          {children}
        </>
      ) : (
        children
      )}
    </Link>
  );
};
