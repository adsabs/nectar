import { IDocsEntity } from '@api';
import { Flex } from '@chakra-ui/react';
import PT from 'prop-types';
import { HTMLAttributes, ReactElement } from 'react';
import { Item } from './Item';

export interface ISimpleResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  indexStart?: number;
  hideCheckboxes?: boolean;
}

const propTypes = {
  docs: PT.arrayOf(PT.object),
  hideCheckboxes: PT.bool,
};

export const SimpleResultList = (props: ISimpleResultListProps): ReactElement => {
  const { docs = [], hideCheckboxes = false, indexStart = 0, ...divProps } = props;

  const start = indexStart === 0 ? 1 : indexStart;

  return (
    <Flex as="article" direction="column" {...divProps}>
      {docs.map((doc, index) => (
        <Item doc={doc} key={doc.bibcode} index={start + index} hideCheckbox={hideCheckboxes} hideActions={false} />
      ))}
    </Flex>
  );
};
SimpleResultList.propTypes = propTypes;
