import { IDocsEntity } from '@nectar/api';
import { useRootMachineContext } from '@nectar/context';
import { useActor } from '@xstate/react';
import React from 'react';
import { Item } from './Item';
import { Skeleton } from './Skeleton';

type Id = IDocsEntity["id"]
interface IResultDoc extends Partial<IDocsEntity> {
  id: Id
};

export interface IResultListProps {
  docs: IResultDoc[];
  loading: boolean;
}

export const ResultList = (props: IResultListProps): React.ReactElement => {
  const { docs, loading = false, } = props;
  const [root] = useRootMachineContext();
  const [state] = useActor(root.context.resultsMachineRef);
  console.log('state', state)


  let list;
  if (loading) {
    list = <Skeleton count={10} />;
  } else {
    list = docs.map((doc, index) => (
      <Item
        doc={doc}
        key={doc.id}
        index={index + 1}
        service={state.context.docRefs[doc.id]}
      />
    ));
  }

  return <div className="flex flex-col space-y-1">{list}</div>;
};
