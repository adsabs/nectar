import { ChevronDownIcon } from '@heroicons/react/solid';
import { ReactElement } from 'react';

export interface ISelectorLabelProps {
  text: string;
  classes: string;
}

export const SelectorLabel = (props: ISelectorLabelProps): ReactElement => {
  const { text, classes } = props;
  return (
    <div className={classes}>
      <span className="inline-block align-baseline p-1.5">{text}</span>
      <ChevronDownIcon className="inline m-1.5 w-4 h-4" />
    </div>
  );
};
