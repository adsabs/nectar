import { SearchPayload } from '@api/search';
import {
  Dialog,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@material-ui/core';
import axios from 'axios';
import { map, transpose } from 'ramda';
import React from 'react';
import { useQuery } from 'react-query';

const AuthorTable = ({ id, open, onClose }: IAuthorTableProps) => {
  const [authors, setAuthors] = React.useState<AuthorAff[]>([]);
  const { data, isSuccess, isFetching } = useSearch(id);

  React.useEffect(() => {
    if (isSuccess && data) {
      const { author, aff, orcid_pub } = data.docs[0];
      const val = map(
        ([author, aff, orcid_pub]) => ({
          name: author,
          aff,
          orcid: orcid_pub,
        }),
        transpose([author, aff, orcid_pub])
      );

      setAuthors(val);
    }
  }, [isSuccess]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-describedby="author-aff-progress"
      aria-busy={isFetching}
      maxWidth="lg"
    >
      <DialogContent>
        <Table size="small" aria-label="author affiliation table">
          <TableHead>
            <TableRow>
              <TableCell>Id</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Affiliation</TableCell>
              <TableCell align="right">ORCiD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {authors.map(({ name, aff, orcid }, i) => (
              <TableRow key={`${name}_${i}}`}>
                <TableCell component="th" scope="row">
                  {i + 1}
                </TableCell>
                <TableCell component="th" scope="row">
                  {name}
                </TableCell>
                <TableCell align="right">{aff}</TableCell>
                <TableCell align="right">{orcid}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export interface IAuthorTableProps {
  id: string;
  open: boolean;
  onClose(): void;
}

export default React.memo<IAuthorTableProps>(
  AuthorTable,
  (prev, next) => prev.id === next.id
);

const useSearch = (id: string) => {
  const query = `id:${id}`;
  const fields = 'id,author,aff,orcid_pub';

  return useQuery(
    [`author_${id}_search`, { query, fields }],
    async (key, { query, fields }) => {
      const { data } = await axios.get<SearchPayload>('/api/search', {
        params: { q: query, fl: fields },
      });

      return data?.response;
    },
    { refetchOnWindowFocus: false, retry: false, suspense: true }
  );
};

type AuthorAff = {
  name: string;
  aff: string;
  orcid: string;
};
