import React from 'react';

const NumFound: React.FC<INumFoundProps> = React.memo(({ numFound = 0 }) => {
  return (
    <p role="status" className="text-xs">
      Your search returned{' '}
      <span className="font-bold">{numFound.toLocaleString()}</span> results
    </p>
  );
});

interface INumFoundProps {
  numFound: number;
}

export default NumFound;
