import { Machine } from 'xstate';

/**
 * handles the toggling open/close of a dialog component.
 */

interface DialogSchema {
  states: {
    opened: {};
    closed: {};
  };
}

type DialogEvent = { type: 'TOGGLE' };

export const dialogMachine = Machine<DialogSchema, DialogEvent>({
  id: 'dialog',
  initial: 'closed',
  states: {
    closed: { on: { TOGGLE: 'opened' } },
    opened: { on: { TOGGLE: 'closed' } },
  },
});
