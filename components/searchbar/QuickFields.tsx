import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  NoSsr,
  Theme,
  useMediaQuery,
} from '@material-ui/core';
import { ControlPoint as ControlPointIcon } from '@material-ui/icons';
import { withStyles } from '@material-ui/styles';
import { useMachine } from '@xstate/react';
import React from 'react';
import { dialogMachine } from './machine';

const QuickFields = () => {
  const [state, send] = useMachine(dialogMachine);
  const toggle = () => send('TOGGLE');
  return (
    <NoSsr>
      <IconButton aria-label="quick fields" onClick={toggle}>
        <ControlPointIcon />
      </IconButton>

      <QuickFieldsDialog open={state.matches('opened')} onClose={toggle} />
    </NoSsr>
  );
};

const QuickFieldList = withStyles((theme: Theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
}))(List);

const QuickFieldsDialog: React.FC<IQuickFieldsDialogProps> = ({
  onClose,
  open,
}) => {
  const fullScreen = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('sm')
  );

  const handleItemClick = (e: any) => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
      fullScreen={fullScreen}
    >
      <DialogTitle>Quick Fields</DialogTitle>
      <DialogContent>
        <QuickFieldList>
          <ListItem button onClick={handleItemClick}>
            <ListItemText primary="author" />
          </ListItem>
        </QuickFieldList>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Okay</Button>
      </DialogActions>
    </Dialog>
  );
};
interface IQuickFieldsDialogProps {
  onClose(): void;
  open: boolean;
}

export default QuickFields;
