import { NasaLogo, SmithsonianLogo } from '@components';
import Image from 'next/image';
import Link from 'next/link';
import cfaLogo from 'public/img/cfa.png';
import { FC, ReactElement } from 'react';

const SimpleLink: FC<{ href: string; icon?: ReactElement }> = ({ children, href, icon }) => {
  const isExternal = /^http(s)/.exec(href);

  return (
    <Link href={href}>
      <a className="block hover:underline focus:underline" rel={isExternal ? 'noopener noreferrer' : undefined}>
        {icon && <>{icon}</>}
        {children}
      </a>
    </Link>
  );
};

export const Footer: FC = () => {
  return (
    <footer className="mt-3 py-6 bg-gray-1000">
      <div className="container flex flex-col justify-between px-3 md:flex-row md:mx-auto md:px-0">
        <div className="flex-col m-3 w-80 md:my-0">
          <p className="mb-3 text-gray-100">
            © The <abbr title="Smithsonian Astrophysical Observatory">SAO</abbr>/
            <abbr title="National Aeronautics and Space Administration">NASA</abbr> Data System
          </p>
          <p className="text-gray-400">adshelp[at]cfa.harvard.edu</p>
          <p className="text-gray-400">
            The <abbr title="Astrophysics Data System">ADS</abbr> is operated by the Smithsonian Astrophysical
            Observatory under <abbr title="National Aeronautics and Space Administration">NASA</abbr> Cooperative
            Agreement 80NSSC21M0056
          </p>
          <div className="flex items-center mt-3">
            <Link href="https://www.nasa.gov">
              <a rel="noopener noreferrer">
                <span className="sr-only">
                  <abbr title="National Aeronautics and Space Administration">NASA</abbr>
                </span>
                <NasaLogo width="80px" height="66px" className="mr-2" aria-hidden />
              </a>
            </Link>
            <Link href="http://www.si.edu/">
              <a rel="noopener noreferrer">
                <span className="sr-only">Smithsonian Institution</span>
                <SmithsonianLogo width="66px" height="68px" aria-hidden className="mr-2" />
              </a>
            </Link>
            <Link href="https://www.cfa.harvard.edu/">
              <a rel="noopener noreferrer" className="ml-2">
                <span className="sr-only">Center for Astrophysics</span>
                <Image src={cfaLogo} width="100px" height="41px" aria-hidden alt="" />
              </a>
            </Link>
          </div>
        </div>
        <div className="flex-col m-3 text-gray-100 md:my-0">
          <p className="mb-3 text-lg">RESOURCES</p>
          <SimpleLink href="/about">
            About <abbr title="Astrophysics Data System">ADS</abbr>
          </SimpleLink>
          <SimpleLink href="/help">
            <abbr title="Astrophysics Data System">ADS</abbr> Help
          </SimpleLink>
          <SimpleLink href="/help/whats_new">What's New</SimpleLink>
          <SimpleLink href="/about/careers">Careers@ADS</SimpleLink>
          <SimpleLink href="/help/accessibility">Accessibilty</SimpleLink>
        </div>
        <div className="flex-col m-3 text-gray-100 md:my-0">
          <p className="mb-3 text-gray-100 text-lg">SOCIAL</p>
          <SimpleLink href="https://twitter.com/adsabs">@adsabs</SimpleLink>
          <SimpleLink href="/blog">
            <abbr title="Astrophysics Data System">ADS</abbr> Blog
          </SimpleLink>
        </div>
        <div className="flex-col m-3 text-gray-100 md:my-0">
          <p className="mb-3 text-gray-100 text-lg">PROJECT</p>
          <SimpleLink href="https://ui.adsabs.harvard.edu/help/privacy/">Privacy Policy</SimpleLink>
          <SimpleLink href="https://ui.adsabs.harvard.edu/help/terms">Terms of Use</SimpleLink>
          <SimpleLink href="http://www.cfa.harvard.edu/sao">Smithsonian Astrophysical Observatory</SimpleLink>
          <SimpleLink href="http://www.si.edu/">Smithsonian Institution</SimpleLink>
          <SimpleLink href="http://www.nasa.gov/">
            <abbr title="National Aeronautics and Space Administration">NASA</abbr>
          </SimpleLink>
        </div>
      </div>
    </footer>
  );
};
