import NextLink, { LinkProps } from 'next/link';
import React from 'react';

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const { as, href, ...rest } = props;

  return (
    <NextLink href={href} as={as}>
      <a ref={ref} {...rest} />
    </NextLink>
  );
});

export default Link;
