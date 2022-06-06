import { FC, ReactElement } from 'react';
import NextLink from 'next/link';
import { Link as ChakraLink } from '@chakra-ui/layout';

export const SimpleLink: FC<{ href: string; icon?: ReactElement; newTab?: boolean; variant?: string }> = ({
  children,
  href,
  icon,
  newTab,
  variant = 'default',
}): ReactElement => {
  const isExternal = newTab || /^http(s)/.test(href);

  return (
    <NextLink href={href} passHref>
      <ChakraLink
        variant={variant ? variant : 'default'}
        display="block"
        isExternal={isExternal}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {icon && <>{icon}</>}
        {children}
      </ChakraLink>
    </NextLink>
  );
};
