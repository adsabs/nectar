import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faTwitter } from '@fortawesome/free-brands-svg-icons';
import {
  faBullhorn,
  faInfoCircle,
  faNewspaper,
  faQuestionCircle,
  faUniversalAccess,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const SimpleLink: React.FC<{ href: string; icon?: IconProp }> = ({
  children,
  href,
  icon,
}) => {
  const isExternal = /^http(s)/.exec(href);

  return (
    <Link href={href}>
      <a
        className="block hover:underline focus:underline"
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {icon && (
          <>
            <FontAwesomeIcon icon={icon} />{' '}
          </>
        )}
        {children}
      </a>
    </Link>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 mt-3 py-6">
      <div className="container mx-auto flex flex-col md:flex-row px-3 md:px-0 justify-between">
        <div className="flex-col w-80">
          <p className="text-gray-100 mb-3">
            © The SAO/NASA Astrophysics Data System
          </p>
          <p className="text-gray-500">adshelp[at]cfa.harvard.edu</p>
          <p className="text-gray-500">
            The ADS is operated by the Smithsonian Astrophysical Observatory
            under NASA Cooperative Agreement 80NSSC21M0056
          </p>
          <div className="flex mt-3 items-center">
            <Link href="https://www.nasa.gov">
              <a rel="noopener noreferrer">
                <Image
                  src="/img/nasa.svg"
                  alt="NASA logo"
                  width="80"
                  height="66"
                  className="mr-2"
                />
              </a>
            </Link>
            <Link href="http://www.si.edu/">
              <a rel="noopener noreferrer">
                <Image
                  src="/img/smithsonian.svg"
                  alt="Smithsonian Institution logo"
                  width="66"
                  height="68"
                  className="mr-2"
                />
              </a>
            </Link>
            <Link href="https://www.cfa.harvard.edu/">
              <a rel="noopener noreferrer" className="ml-2">
                <Image
                  src="/img/cfa.png"
                  alt="Center for Astrophysics logo"
                  width="100"
                  height="41"
                />
              </a>
            </Link>
          </div>
        </div>
        <div className="flex-col text-gray-100">
          <p className="text-lg mb-3">Resources</p>
          <SimpleLink href="/about" icon={faQuestionCircle}>
            About ADS
          </SimpleLink>
          <SimpleLink href="/help" icon={faInfoCircle}>
            ADS Help
          </SimpleLink>
          <SimpleLink href="/help/whats_new" icon={faBullhorn}>
            What's New
          </SimpleLink>
          <SimpleLink href="/about/careers" icon={faUsers}>
            Careers@ADS
          </SimpleLink>
          <SimpleLink href="/help/accessibility" icon={faUniversalAccess}>
            Accessibilty
          </SimpleLink>
        </div>
        <div className="flex-col text-gray-100">
          <p className="text-lg text-gray-100 mb-3">Social</p>
          <SimpleLink href="https://twitter.com/adsabs" icon={faTwitter}>
            @adsabs
          </SimpleLink>
          <SimpleLink href="/blog" icon={faNewspaper}>
            ADS Blog
          </SimpleLink>
        </div>
        <div className="flex-col text-gray-100">
          <p className="text-lg text-gray-100 mb-3">Project</p>
          <SimpleLink href="#">Privacy Policy</SimpleLink>
          <SimpleLink href="#">Terms of Use</SimpleLink>
          <SimpleLink href="#">
            Smithsonian Astrophysical Observatory
          </SimpleLink>
          <SimpleLink href="#">Smithsonian Institution</SimpleLink>
          <SimpleLink href="#">NASA</SimpleLink>
        </div>
      </div>
    </footer>
  );
};
