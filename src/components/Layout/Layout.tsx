import { LandingTabs } from '@components/LandingTabs';
import { rootService } from '@machines';
import { useRouter } from 'next/router';
import React, { FC, HTMLAttributes, ReactChild } from 'react';
import { Footer } from '../Footer';
import { NavBar } from '../NavBar';

export interface ILayoutProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactChild;
  service: typeof rootService;
}

export const Layout: FC<ILayoutProps> = ({ children, service }) => {
  const router = useRouter();
  const isLandingPages = /^(\/|\/classic-form|\/paper-form)$/.exec(
    router.asPath,
  );
  return (
    <section className="flex flex-col font-sans bg-gray-50">
      <NavBar />
      <main>
        {isLandingPages && <LandingTabs />}
        <div className="container mx-auto" id="main-content">
          {children}
        </div>
      </main>
      <Footer />
    </section>
  );
};
