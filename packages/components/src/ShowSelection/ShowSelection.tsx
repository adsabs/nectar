import { IDocMachine, useRootMachineContext } from '@nectar/context';
import { useSelector } from '@xstate/react';
import React from 'react';

export const ShowSelection = (): React.ReactElement => {
  const [root] = useRootMachineContext();
  const refs = useSelector(root.context.resultsMachineRef, (state) => state.context.docRefs);
  const selected = Object.values(refs)
    .filter((doc) => (doc.state as IDocMachine['state']).matches('select.selected')).length;

  const otherSelection = useSelector(root.context.resultsMachineRef, (state) => state.context.selected.length);
  console.log({ selected })
  return (
    <div>
      <p>Selected {selected} docs <br />(using state match)</p>
      <p>Selected {otherSelection} docs <br />(using events)</p>
    </div>
  );
}
