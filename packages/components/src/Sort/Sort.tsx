import React, { FC, HTMLAttributes, ReactChild } from 'react';

export interface ISortProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactChild
}

export const Sort: FC<ISortProps> = ({ children }) => {
  return (
    <div>
      <p>👋 from Sort component</p>
      <p>{ children }</p>
    </div>
  );
}
