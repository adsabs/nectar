import { Button, ButtonProps } from '@chakra-ui/react';
import { MouseEventHandler, ReactElement } from 'react';
import { useRouter } from 'next/router';
import { ISimpleLinkProps, SimpleLink } from '@/components/SimpleLink';
import { makeSearchParams } from '@/utils/common/search';
import { IADSApiSearchParams } from '@/api/search/types';
import { useStore } from '@/store';
import { buildSearchOutgoing } from '@/utils/common/searchMode';

export interface ISearchQueryLinkProps extends Omit<ISimpleLinkProps, 'href'> {
  params: IADSApiSearchParams;
}

const getSearchUrl = (params: IADSApiSearchParams, searchMode: string) =>
  `/search?${makeSearchParams(buildSearchOutgoing(params, searchMode))}`;

export const SearchQueryLink = (props: ISearchQueryLinkProps): ReactElement => {
  const { params, replace = false, shallow = false, prefetch = false, ...linkProps } = props;
  const searchMode = useStore((s) => s.searchMode);

  return (
    <SimpleLink
      replace={replace}
      shallow={shallow}
      prefetch={prefetch}
      {...linkProps}
      href={getSearchUrl(params, searchMode)}
    />
  );
};

export interface ISearchQueryLinkButtonProps extends Omit<ButtonProps, 'onClick'> {
  params: IADSApiSearchParams;
}
export const SearchQueryLinkButton = (props: ISearchQueryLinkButtonProps) => {
  const { params, ...buttonProps } = props;
  const router = useRouter();
  const searchMode = useStore((s) => s.searchMode);

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    void router.push(getSearchUrl(params, searchMode));
  };

  return <Button type="button" onClick={handleClick} {...buttonProps} />;
};
