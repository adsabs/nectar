import { AdsSmallLogo } from '@components/images';
import { useAppCtx } from '@store';
import { Theme } from '@types';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import starBg from 'public/img/bg-astro.jpg';
import bioBg from 'public/img/bg-bio.jpg';
import earthBg from 'public/img/bg-earth.jpg';
import generalBg from 'public/img/bg-general.jpg';
import helioBg from 'public/img/bg-helio.jpg';
import planetBg from 'public/img/bg-planet.jpg';
import { ReactElement, useEffect, useState } from 'react';

const backgroundMap = new Map<Theme, StaticImageData>([
  [Theme.GENERAL, generalBg],
  [Theme.ASTROPHYSICS, starBg],
  [Theme.HELIOPHYISCS, helioBg],
  [Theme.PLANET_SCIENCE, planetBg],
  [Theme.EARTH_SCIENCE, earthBg],
  [Theme.BIO_PHYSICAL, bioBg],
]);

export const LandingTabs = (): ReactElement => {
  const {
    state: { theme },
  } = useAppCtx();
  const [showTabs, setShowTabs] = useState(false);
  const [img, setImg] = useState<StaticImageData>(null);

  useEffect(() => {
    setShowTabs(theme === Theme.ASTROPHYSICS);
    setImg(backgroundMap.get(theme));
  }, [theme]);

  return (
    <div className="relative flex flex-col items-center justify-center bg-black" suppressHydrationWarning>
      {img !== null && (
        <Image
          className="z-0 opacity-50 object-cover"
          src={img}
          aria-hidden="true"
          layout="fill"
          quality={30}
          priority
          alt=""
        />
      )}

      <div className="flex items-center p-6">
        <TitleLogo />
      </div>
      <Tabs show={showTabs} />
    </div>
  );
};

const Tabs = ({ show }: { show: boolean }) => {
  const { asPath } = useRouter();
  if (!show) {
    return null;
  }
  return (
    <div className="z-10 flex gap-2 justify-center text-white sm:text-xl">
      <Tab href="/classic-form" label="Classic Form" active={asPath === '/classic-form'} />
      <Tab href="/" label="Modern Form" active={asPath === '/'} />
      <Tab href="/paper-form" label="Paper Form" active={asPath === '/paper-form'} />
    </div>
  );
};

const TitleLogo = () => (
  <h1 className="z-10 hidden gap-2 items-center text-white sm:flex">
    <AdsSmallLogo width="75px" height="75px" aria-hidden />
    <span className="text-gray-100 font-bold">NASA</span> <span className="text-gray-100">Science Explorer</span>
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
      'bg-opacity-100 text-blue-800': active,
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
