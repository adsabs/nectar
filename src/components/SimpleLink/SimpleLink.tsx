import { Link as ChakraLink, LinkProps } from '@chakra-ui/react';
import NextLink from 'next/link';
import { FC, ReactElement } from 'react';

export interface ISimpleLinkProps extends LinkProps {
  href: string;
  icon?: ReactElement;
  newTab?: boolean;
  variant?: string;
}

export const SimpleLink: FC<ISimpleLinkProps> = (props): ReactElement => {
  const { children, href, icon, newTab, variant = 'default', ...linkProps } = props;
  const isExternal = newTab || /^https?/.test(href);

  return (
    <NextLink href={href} passHref legacyBehavior>
      <ChakraLink
        variant={variant || 'default'}
        display="block"
        isExternal={isExternal}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        {...linkProps}
      >
        <>
          {icon && <>{icon}</>}
          {children}
        </>
      </ChakraLink>
    </NextLink>
  );
};
