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
    <footer className="mt-3 py-6 bg-gray-1000">
      <div className="container flex flex-col justify-between px-3 md:flex-row md:mx-auto md:px-0">
        <div className="flex-col w-80">
          <p className="mb-3 text-gray-100">© The SAO/NASA Data System</p>
          <p className="text-gray-500">adshelp[at]cfa.harvard.edu</p>
          <p className="text-gray-500">
            The ADS is operated by the Smithsonian Astrophysical Observatory
            under NASA Cooperative Agreement 80NSSC21M0056
          </p>
          <div className="flex items-center mt-3">
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
          <p className="mb-3 text-lg">Resources</p>
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
          <p className="mb-3 text-gray-100 text-lg">Social</p>
          <SimpleLink href="https://twitter.com/adsabs" icon={faTwitter}>
            @adsabs
          </SimpleLink>
          <SimpleLink href="/blog" icon={faNewspaper}>
            ADS Blog
          </SimpleLink>
        </div>
        <div className="flex-col text-gray-100">
          <p className="mb-3 text-gray-100 text-lg">Project</p>
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
