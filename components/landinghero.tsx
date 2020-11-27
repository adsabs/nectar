import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

const LandingHero: React.FC = () => {
  return (
    <>
      <section className="relative overflow-hidden h-28 lg:h-40 hidden md:block">
        <div className="w-full">
          <Image
            src="/img/star-bg-cropped.png"
            alt="starry background"
            layout="responsive"
            width="1521"
            height="643"
          />
        </div>

        {/* logo and name */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-13 lg:-translate-y-2/3 transform">
          <div className="flex justify-center items-center flex-no-wrap">
            <Image
              src="/img/transparent_logo.svg"
              alt="Astrophysics Data System logo"
              width="80"
              height="80"
              // className="w-10 h-10 md:w-14 md:h-14 lg:w-20 lg:h-20"
            />
            <div className="flex items-center">
              <div className="text-white ml-1 md:text-4xl lg:text-5xl whitespace-no-wrap">
                <span className="font-bold">astrophysics</span>
                <span className="font-light ml-2">data system</span>
              </div>
            </div>
          </div>
        </div>

        {/* tabs */}
        <div className="absolute bottom-0 w-full">
          <ul className="flex justify-center">
            <Tab href="/classic-form" label="Classic Form" />
            <Tab href="/" label="Modern Form" />
            <Tab href="/paper-form" label="Paper Form" />
          </ul>
        </div>
      </section>

      {/* Mobile-only tabs */}
      <section className="md:hidden">
        <ul className="flex justify-center">
          <Tab href="/classic-form" label="Classic Form" />
          <Tab href="/" label="Modern Form" />
          <Tab href="/paper-form" label="Paper Form" />
        </ul>
      </section>
    </>
  );
};

interface ITabProps {
  href: string;
  label: string;
}
const Tab: React.FC<ITabProps> = ({ href, label }) => {
  const { asPath } = useRouter();
  const selected = React.useMemo(() => asPath === href, [asPath, href]);

  const tabCls = clsx(
    {
      'bg-black bg-opacity-75 hover:bg-opacity-100 hover:bg-gray-800 focus:bg-opacity-100 focus:bg-gray-800 ': !selected,
    },
    { 'bg-white hover:bg-gray-50': selected },
    'flex justify-center md:rounded-t py-2 px-3 md:py-3 md:px-5 transition-colors'
  );
  const textCls = clsx(
    { 'text-white': !selected },
    { 'text-blue-600': selected },
    'md:text-lg'
  );

  return (
    <li className="flex-1 md:flex-none md:mr-1 last:ml-1 last:-mr-1">
      <Link href={href}>
        <a className={tabCls}>
          <div className={textCls}>{label}</div>
        </a>
      </Link>
    </li>
  );
};

export default LandingHero;
