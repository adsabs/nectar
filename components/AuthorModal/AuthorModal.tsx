import { Button } from '@material-ui/core';
import { useMachine } from '@xstate/react';
import React from 'react';
import AuthorTable from './AuthorTable';
import { dialogMachine } from './machine';

const AuthorModal: React.FC<IAuthorModal> = ({ id }) => {
  const [state, send] = useMachine(dialogMachine);
  const open = state.matches('opened');
  const toggle = () => send('TOGGLE');

  return (
    <>
      <Button size="small" onClick={toggle} variant="outlined">
        See All Authors
      </Button>

      <AuthorTable id={id} onClose={toggle} open={open} />
    </>
  );
};

interface IAuthorModal {
  id: string;
}

export default AuthorModal;
