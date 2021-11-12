import { LandingTabs } from '@components/LandingTabs';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Footer } from '../Footer';
import { NavBar } from '../NavBar';
import Head from 'next/head';

export const Layout: FC = ({ children }) => {
  const router = useRouter();
  const isLandingPages = /^(\/|\/classic-form|\/paper-form)$/.exec(router.asPath);
  return (
    <section className="default-text-color flex flex-col min-h-screen font-sans bg-white">
      <Head>
        <title>NASA Science Explorer</title>
      </Head>
      <NavBar />
      <main>
        {isLandingPages && <LandingTabs />}
        <div className="mx-auto lg:container" id="main-content">
          {children}
        </div>
      </main>
      <Footer />
    </section>
  );
};
