import { IADSApiSearchParams } from '@api';
import { Link, LinkProps as ChackraLinkProps } from '@chakra-ui/react';
import { makeSearchParams } from '@utils';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import PT from 'prop-types';
import { ReactElement } from 'react';

type LinkProps = ChackraLinkProps & Omit<NextLinkProps, 'as' | 'href' | 'passHref' | 'prefetch'>;
export interface ISearchQueryLinkProps extends LinkProps {
  params: IADSApiSearchParams;
}

const propTypes = {
  children: PT.element,
};

export const SearchQueryLink = (props: ISearchQueryLinkProps): ReactElement => {
  const { params, replace = false, scroll, shallow = false, locale, ...chakraLinkProps } = props;

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
      <Link {...chakraLinkProps} />
    </NextLink>
  );
};

SearchQueryLink.propTypes = propTypes;
