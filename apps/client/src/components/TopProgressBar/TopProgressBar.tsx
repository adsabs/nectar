import { useRouter } from 'next/router';
import NProgress from 'nprogress';
import { ReactElement, useEffect } from 'react';

export const TopProgressBar = (): ReactElement => {
  const Router = useRouter();

  const load = () => {
    NProgress.start();
  };
  const stop = () => {
    NProgress.done();
  };

  useEffect(() => {
    Router.events.on('routeChangeStart', load);
    Router.events.on('routeChangeComplete', stop);
    Router.events.on('routeChangeError', stop);
    return () => {
      Router.events.off('routeChangeStart', load);
      Router.events.off('routeChangeComplete', stop);
      Router.events.off('routeChangeError', stop);
    };
  }, [Router]);

  return <></>;
};
