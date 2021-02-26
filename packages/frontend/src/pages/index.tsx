import { Counter } from '@nectar/components';
import React, { FC } from 'react';
import { useRootMachineContext } from '../context';

const HomePage: FC = () => {
  const [current, send] = useRootMachineContext();

  return (
    <div>
      <Counter
        count={current.context.count}
        onIncrement={() => send({ type: 'INC' })}
        onDecrement={() => send({ type: 'DEC' })}
      />
    </div>
  );
};

export default HomePage;
