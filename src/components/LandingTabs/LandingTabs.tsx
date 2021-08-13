import { useAppCtx } from '@store';
import { Theme } from '@types';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

const background = new Map<Theme, string>([
  [Theme.GENERAL, '/img/bg-general.jpg'],
  [Theme.ASTROPHYSICS, '/img/star-bg-cropped.png'],
  [Theme.HELIOPHYISCS, '/img/bg-helio.jpg'],
  [Theme.PLANET_SCIENCE, '/img/bg-planet.jpg'],
  [Theme.EARTH_SCIENCE, '/img/bg-earth.jpg'],
  [Theme.BIO_PHYSICAL, '/img/bg-bio.jpg'],
]); 

export const LandingTabs = (): React.ReactElement => {

  const { state: appState } = useAppCtx();

  const { asPath } = useRouter();

  return (
    <div className="relative flex flex-col items-center justify-center">
      <Image className="z-0 object-cover" src={background.get(appState.theme)} aria-hidden="true" layout="fill" />
      <div className="flex items-center p-6">
        <TitleLogo />
      </div>
      { appState.theme === Theme.ASTROPHYSICS ? (
        <div className="z-10 flex gap-2 justify-center text-white text-xl">
          <Tab href="/classic-form" label="Classic Form" active={asPath === '/classic-form'} />
          <Tab href="/" label="Modern Form" active={asPath === '/'} />
          <Tab href="/paper-form" label="Paper Form" active={asPath === '/paper-form'} />
        </div>
       ) : 
        null 
      }
    </div>
  );
};

const TitleLogo = () => (
  <h1 className="z-10 hidden gap-2 items-center text-white sm:flex">
    <Image src="/img/transparent_logo.svg" width="75px" height="75px" aria-hidden="true" />
    <span className="font-bold text-gray-100">NASA</span> <span className="text-gray-100">Science Explorer</span>
  </h1>
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
      'bg-opacity-0 text-gray-100 hover:bg-opacity-20': !active,
    },
    'flex-auto px-5 py-3 bg-white rounded-t-md',
  );

  return (
    <Link href={href}>
      <a className={classes}>{label}</a>
    </Link>
  );
};
