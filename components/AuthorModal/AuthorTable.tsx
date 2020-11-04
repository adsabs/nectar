import {
  CircularProgress,
  Dialog,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { useMachine, useService } from '@xstate/react';
import Link from 'next/link';
import React from 'react';
import { Interpreter } from 'xstate';
import {
  createAuthorTableMachine,
  PaginationContext,
  PaginationEvent,
} from './machine';

const AuthorTable: React.FC<IAuthorTableProps> = ({ id, open, onClose }) => {
  const authorTableMachine = React.useMemo(() => createAuthorTableMachine(id), [
    id,
  ]);
  const [state, send] = useMachine(authorTableMachine, { devTools: true });

  React.useEffect(() => {
    if (open) {
      send('FETCH');
    }
  }, [open]);

  const handleClose = () => {
    send('RESET');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-describedby="author-aff-progress"
      aria-busy={state.matches('loading')}
      maxWidth="lg"
    >
      {state.matches('loading') && (
        <DialogContent>
          <CircularProgress />
        </DialogContent>
      )}
      {state.matches('failure') && (
        <DialogContent>
          <Alert severity="error">
            Something went wrong with the request, please try again.
          </Alert>
        </DialogContent>
      )}
      {state.matches('loaded') && (
        <DialogContent>
          <PagerTable pagerService={state.context.pager} />
        </DialogContent>
      )}
    </Dialog>
  );
};

interface PagerTableProps {
  pagerService: Interpreter<PaginationContext, any, PaginationEvent, any>;
}
const PagerTable: React.FC<PagerTableProps> = ({ pagerService }) => {
  const [state, send] = useService(pagerService);
  const { count, rowsPerPage, page, rows } = state.context;

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    send({ type: 'UPDATE_PER_PAGE', value: +event.target.value });
  };

  const handleChangePage = (_: unknown, value: number) => {
    send({ type: 'UPDATE_PAGE', value });
  };

  return (
    <>
      <TableContainer>
        <Table size="small" aria-label="author affiliation table">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Affiliation</TableCell>
              <TableCell align="right">ORCiD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ name, aff, orcid, position }, i) => (
              <TableRow key={`${name}_${i}}`}>
                <TableCell component="th" scope="row">
                  {position}
                </TableCell>
                <TableCell component="th" scope="row">
                  <Link href={`/search/query?q=author:"${name}"`}>{name}</Link>
                </TableCell>
                <TableCell align="right" component="th" scope="row">
                  {aff === '-' ? null : aff}
                </TableCell>
                <TableCell align="right" component="th" scope="row">
                  {orcid === '-' ? null : (
                    <Link href={`/search/query?q=orcid:"${orcid}"`}>
                      <img src="/orcid.png" alt={orcid} />
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={count}
        rowsPerPage={rowsPerPage}
        page={page}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </>
  );
};

export interface IAuthorTableProps {
  id: string;
  open: boolean;
  onClose(): void;
}

export default AuthorTable;
