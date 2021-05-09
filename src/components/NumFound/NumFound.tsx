import React, { ReactElement } from 'react';

export interface INumFoundProps {
  count?: number;
  citationsCount?: number;
  normalizedCitationsCount?: number;
}

// pin lower bound to 0, so we don't get negative numbers, and convert to locale string
const sanitizeNum = (num: number): string => {
  return (num < 0 ? 0 : num).toLocaleString();
};

export const NumFound = (props: INumFoundProps): ReactElement => {
  const { count = 0, citationsCount, normalizedCitationsCount } = props;

  const countString = typeof count === 'number' ? sanitizeNum(count) : '0';
  const citationsString =
    typeof citationsCount === 'number' ? (
      <>
        {' '}
        with <span className="font-bold">
          {sanitizeNum(citationsCount)}
        </span>{' '}
        total citations
      </>
    ) : null;
  const normalizedCitationsString =
    typeof normalizedCitationsCount === 'number' ? (
      <>
        {' '}
        with{' '}
        <span className="font-bold">
          {sanitizeNum(normalizedCitationsCount)}
        </span>{' '}
        total normalized citations
      </>
    ) : null;

  return (
    <p role="status" className="text-xs">
      Your search returned <span className="font-bold">{countString}</span>{' '}
      results{citationsString}
      {normalizedCitationsString}
    </p>
  );
};
