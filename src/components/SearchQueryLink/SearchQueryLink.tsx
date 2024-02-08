import { IADSApiSearchParams } from '@api';
import { Button, ButtonProps, Link, LinkProps as ChackraLinkProps } from '@chakra-ui/react';
import { makeSearchParams } from '@utils';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { MouseEventHandler, ReactElement } from 'react';
import { useRouter } from 'next/router';

type LinkProps = ChackraLinkProps & Omit<NextLinkProps, 'as' | 'href' | 'passHref' | 'prefetch'>;
export interface ISearchQueryLinkProps extends LinkProps {
  params: IADSApiSearchParams;
}

const getSearchUrl = (params: IADSApiSearchParams) => `/search?${makeSearchParams(params)}`;

/**
 * Wrapper around next/link to create a simple link to the search page
 * This generates the URL based on the params passed in
 */
export const SearchQueryLink = (props: ISearchQueryLinkProps): ReactElement => {
  const { params, replace = false, scroll, shallow = false, locale, ...linkProps } = props;

  return (
    <NextLink
      href={getSearchUrl(params)}
      locale={locale}
      replace={replace}
      shallow={shallow}
      scroll={scroll}
      passHref
      legacyBehavior
    >
      <Link {...linkProps} />
    </NextLink>
  );
};

export interface ISearchQueryLinkButtonProps extends Omit<ButtonProps, 'onClick'> {
  params: IADSApiSearchParams;
}
export const SearchQueryLinkButton = (props: ISearchQueryLinkButtonProps) => {
  const { params, ...buttonProps } = props;
  const router = useRouter();

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    void router.push(getSearchUrl(params));
  };

  return <Button type="button" onClick={handleClick} {...buttonProps} />;
};
