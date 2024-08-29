import { Button, ButtonProps } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { MouseEventHandler, ReactElement } from 'react';

import { IADSApiSearchParams } from '@/api';
import { ISimpleLinkProps, SimpleLink } from '@/components';
import { makeSearchParams } from '@/utils';

export interface ISearchQueryLinkProps extends Omit<ISimpleLinkProps, 'href'> {
  params: IADSApiSearchParams;
}

const getSearchUrl = (params: IADSApiSearchParams) => `/search?${makeSearchParams(params)}`;

/**
 * Wrapper around next/link to create a simple link to the search page
 * This generates the URL based on the params passed in
 */
export const SearchQueryLink = (props: ISearchQueryLinkProps): ReactElement => {
  const { params, replace = false, shallow = false, prefetch = true, ...linkProps } = props;

  return <SimpleLink replace={replace} shallow={shallow} {...linkProps} href={getSearchUrl(params)} />;
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
