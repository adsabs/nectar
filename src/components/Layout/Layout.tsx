import { LandingTabs } from '@components/LandingTabs';
import { useRouter } from 'next/router';
import React, { FC, HTMLAttributes, ReactChild } from 'react';
import { Footer } from '../Footer';
import { NavBar } from '../NavBar';

export interface ILayoutProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactChild;
}

export const Layout: FC<ILayoutProps> = ({ children }) => {
  const router = useRouter();
  const isLandingPages = /^(\/|\/classic-form|\/paper-form)$/.exec(router.asPath);
  return (
    <section className="default-text-color flex flex-col min-h-screen font-sans bg-white">
      <NavBar />
      <main>
        {isLandingPages && <LandingTabs />}
        <div className="mx-auto md:container" id="main-content">
          {children}
        </div>
      </main>
      <Footer />
    </section>
  );
};
