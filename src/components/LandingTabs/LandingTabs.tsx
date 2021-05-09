import React, { FC, HTMLAttributes, ReactChild } from 'react';

export interface ILandingTabsProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactChild
}

export const LandingTabs: FC<ILandingTabsProps> = ({ children }) => {
  return (
    <div>
      <p>👋 from LandingTabs component</p>
      <p>{ children }</p>
    </div>
  );
}
