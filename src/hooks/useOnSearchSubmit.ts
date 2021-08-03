import { NextRouter } from 'next/router';
import React, { useCallback } from 'react';

export const useOnSearchSubmit = (Router: NextRouter): React.ChangeEventHandler<HTMLFormElement> => {
  const handleOnSubmit = useCallback(
    (e: React.ChangeEvent<HTMLFormElement>) => {
      e.preventDefault();
      const query = (e.currentTarget as HTMLFormElement & { q: HTMLInputElement }).q.value;
      void Router.push(`/search?q=${query}&sort=date+desc`);
    },
    [Router],
  );
  return handleOnSubmit;
};
