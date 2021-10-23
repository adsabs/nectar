import { useAppCtx } from '@store';
import { Theme } from '@types';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { Reducer, useEffect, useReducer } from 'react';

const backgroundMap = new Map<Theme, string>([
  [Theme.GENERAL, '/img/bg-general.jpg'],
  [Theme.ASTROPHYSICS, '/img/star-bg-cropped.png'],
  [Theme.HELIOPHYISCS, '/img/bg-helio.jpg'],
  [Theme.PLANET_SCIENCE, '/img/bg-planet.jpg'],
  [Theme.EARTH_SCIENCE, '/img/bg-earth.jpg'],
  [Theme.BIO_PHYSICAL, '/img/bg-bio.jpg'],
]);

const initialState = {
  showTabs: false,
  background: backgroundMap.get(Theme.GENERAL),
};
type Action = { type: 'UPDATE_THEME'; payload: Theme };
const reducer: Reducer<typeof initialState, Action> = (state, { type, payload }) => {
  if (type === 'UPDATE_THEME') {
    return {
      showTabs: payload === Theme.ASTROPHYSICS,
      background: backgroundMap.get(payload),
    };
  }

  return state;
};

export const LandingTabs = (): React.ReactElement => {
  const {
    state: { theme },
  } = useAppCtx();
  const { asPath } = useRouter();
  const [{ background, showTabs }, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: 'UPDATE_THEME', payload: theme });
  }, [theme]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <Image className="z-0 object-cover" src={background} aria-hidden="true" layout="fill" />
      <div className="flex items-center p-6">
        <TitleLogo />
      </div>
      {showTabs ? (
        <div className="z-10 flex gap-2 justify-center text-white sm:text-xl">
          <Tab href="/classic-form" label="Classic Form" active={asPath === '/classic-form'} />
          <Tab href="/" label="Modern Form" active={asPath === '/'} />
          <Tab href="/paper-form" label="Paper Form" active={asPath === '/paper-form'} />
        </div>
      ) : null}
    </div>
  );
};

const TitleLogo = () => (
  <h1 className="z-10 hidden gap-2 items-center text-white sm:flex">
    <Image src="/img/transparent_logo.svg" width="75px" height="75px" aria-hidden="true" />
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
