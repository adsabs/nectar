import search from '@api/search';
import Link from '@components/Link';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import { map, transpose } from 'ramda';
import React from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(2),
      padding: theme.spacing(1),
    },
  })
);

const AuthorPage: NextPage<AuthorPageProps> = ({ authors, title, bibcode }) => {
  const classes = useStyles();

  return (
    <Paper className={classes.root}>
      <Box mb="1rem">
        <Typography variant="h6" component="h2">
          Viewing authors for <Link href={`/abs/${bibcode}`}>{title}</Link>
        </Typography>
      </Box>
      <TableContainer>
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
                <TableCell align="right" component="th" scope="row">
                  {aff}
                </TableCell>
                <TableCell align="right" component="th" scope="row">
                  {orcid}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export type Author = { name: string; aff: string; orcid: string };

interface AuthorPageProps {
  authors: Author[];
  title?: string;
  bibcode?: string;
}

export const getServerSideProps: GetServerSideProps<AuthorPageProps> = async (
  ctx: GetServerSidePropsContext
) => {
  try {
    const {
      response: { docs },
    } = await search({
      searchParams: {
        q: `identifier:${ctx.query.id}`,
        fl: 'id,title,author,aff,orcid_pub,bibcode',
        rows: 1,
      },
      ctx,
    });

    const { author, aff, orcid_pub } = docs[0];
    const authors = map(
      ([author, aff, orcid_pub]) => ({
        name: author,
        aff,
        orcid: orcid_pub,
      }),
      transpose([author, aff, orcid_pub])
    );

    return {
      props: {
        authors,
        title: docs[0].title[0],
        bibcode: docs[0].bibcode,
      },
    };
  } catch (e) {
    return {
      props: { authors: [], title: undefined, bibcode: undefined },
    };
  }
};

export default AuthorPage;
