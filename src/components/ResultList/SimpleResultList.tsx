import { IDocsEntity } from '@api';
import PT from 'prop-types';
import { HTMLAttributes, ReactElement } from 'react';
import { Item } from './Item';

export interface ISimpleResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  indexStart: number;
  hideCheckboxes?: boolean;
}

const propTypes = {
  docs: PT.arrayOf(PT.object),
  hideCheckboxes: PT.bool,
};

export const SimpleResultList = (props: ISimpleResultListProps): ReactElement => {
  const { docs = [], hideCheckboxes = false, indexStart = 0, ...divProps } = props;

  return (
    <article {...divProps} className="flex flex-col mt-1 space-y-1">
      {docs.map((doc, index) => (
        <Item
          doc={doc}
          key={doc.bibcode}
          index={indexStart + 1 + index}
          hideCheckbox={hideCheckboxes}
          hideActions={false}
        />
      ))}
    </article>
  );
};
SimpleResultList.propTypes = propTypes;
