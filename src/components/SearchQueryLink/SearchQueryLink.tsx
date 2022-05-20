import { IADSApiSearchParams } from '@api';
import { Link, LinkProps as ChackraLinkProps } from '@chakra-ui/react';
import { useUpdateQuery } from '@hooks/useUpdateQuery';
import { makeSearchParams } from '@utils';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import PT from 'prop-types';
import { MouseEventHandler, ReactElement } from 'react';

type LinkProps = ChackraLinkProps & Omit<NextLinkProps, 'as' | 'href' | 'passHref' | 'prefetch'>;
export interface ISearchQueryLinkProps extends LinkProps {
  params: IADSApiSearchParams;
}

const propTypes = {
  children: PT.element,
};

export const SearchQueryLink = (props: ISearchQueryLinkProps): ReactElement => {
  const { params, replace = false, scroll, shallow = false, locale, ...chakraLinkProps } = props;
  const { prepareSearch } = useUpdateQuery();

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    prepareSearch(params);
    if (typeof chakraLinkProps.onClick === 'function') {
      chakraLinkProps.onClick(e);
    }
  };

  return (
    <NextLink
      href={{
        pathname: '/search',
        search: makeSearchParams(params),
      }}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      locale={locale}
      passHref
    >
      <Link {...chakraLinkProps} onClick={handleClick} />
    </NextLink>
  );
};

SearchQueryLink.propTypes = propTypes;
