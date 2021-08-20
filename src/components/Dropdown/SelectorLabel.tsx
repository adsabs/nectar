import { ChevronDownIcon } from '@heroicons/react/solid';
import React from 'react';

export interface ISelectorLabelProps {
  text: string;
  classes: string;
}

export const SelectorLabel = (props: ISelectorLabelProps): React.ReactElement => {
  const { text, classes } = props;
  return (
  <div className={classes} >
    <span className="inline-block align-baseline p-1.5">{text}</span>
    <ChevronDownIcon className="inline m-1.5 w-4 h-4" />
  </div>
  )
};