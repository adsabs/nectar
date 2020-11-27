import Footer from '@components/footer';
import LandingHero from '@components/landinghero';
import NavBar from '@components/navbar';
import { useRouter } from 'next/router';
import React from 'react';

const Layout: React.FC = ({ children }) => {
  const { asPath } = useRouter();
  const showHero = React.useMemo(
    () => ['/', '/classic-form', '/paper-form'].includes(asPath),
    [asPath]
  );

  return (
    <section className="flex flex-col">
      <NavBar />
      <main>
        {showHero && <LandingHero />}
        <div className="container mx-auto" id="main-content">
          {children ?? ''}
        </div>
      </main>
      <Footer />
    </section>
  );
};

export default Layout;
