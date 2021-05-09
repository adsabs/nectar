import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

export const LandingTabs = (): React.ReactElement => {
  const { asPath } = useRouter();

  return (
    <div className="relative flex flex-col items-center justify-center">
      <Image
        className="z-0 object-cover"
        src="/img/star-bg-cropped.png"
        aria-hidden="true"
        layout="fill"
      />
      <div className="flex items-center p-6">
        <TitleLogo />
      </div>
      <div className="z-10 flex gap-2 justify-center text-white text-xl">
        <Tab
          href="/classic-form"
          label="Classic Form"
          active={asPath === '/classic-form'}
        />
        <Tab href="/" label="Modern Form" active={asPath === '/'} />
        <Tab
          href="/classic-form"
          label="Paper Form"
          active={asPath === '/paper-form'}
        />
      </div>
    </div>
  );
};

const TitleLogo = () => (
  <article className="z-10 hidden gap-2 items-center text-white text-5xl sm:flex">
    <Image
      src="/img/transparent_logo.svg"
      width="75px"
      height="75px"
      aria-hidden="true"
    />
    <span className="font-bold">astrophysics</span> data system
  </article>
);

interface ITabProps {
  href: string;
  label: string;
  active: boolean;
}
const Tab = ({ href, label, active }: ITabProps) => {
  const classes = clsx(
    {
      'bg-opacity-100 text-blue-500 hover:text-blue-800': active,
      'bg-opacity-0 hover:bg-opacity-20': !active,
    },
    'flex-auto px-5 py-3 bg-ads-base rounded-t-md',
  );

  return (
    <Link href={href}>
      <a className={classes}>{label}</a>
    </Link>
  );
};
