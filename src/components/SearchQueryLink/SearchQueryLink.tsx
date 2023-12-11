import { IADSApiSearchParams } from '@api';
import { Button, ButtonProps } from '@chakra-ui/react';
import { makeSearchParams } from '@utils';
import { MouseEventHandler } from 'react';
import { useRouter } from 'next/router';
import { SimpleLink, SimpleLinkProps } from '@components';

export interface ISearchQueryLinkProps extends Omit<SimpleLinkProps, 'href'> {
  params: IADSApiSearchParams;
}

const getSearchUrl = (params: IADSApiSearchParams) => `/search?${makeSearchParams(params)}`;

/**
 * Wrapper around next/link to create a simple link to the search page
 * This generates the URL based on the params passed in
 */
export const SearchQueryLink = (props: ISearchQueryLinkProps) => {
  const { params, replace = false, scroll, shallow = false, locale, ...linkProps } = props;
  return (
    <SimpleLink
      href={getSearchUrl(params)}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      locale={locale}
      {...linkProps}
    />
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
