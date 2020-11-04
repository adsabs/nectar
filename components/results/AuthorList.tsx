import AuthorModal from '@components/AuthorModal';
import { Button, Grid, NoSsr, Typography } from '@material-ui/core';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

const MAX = 10;
const AuthorList: React.FC<IAuthorListProps> = ({
  authors = [],
  count = 0,
  links,
  canShowAll,
  id,
}) => {
  const router = useRouter();

  return (
    <>
      <Grid container>
        {links
          ? authors.map((author) => (
              <Link
                href={`/search/query?q=author:"${author}"`}
                key={author}
                passHref
              >
                <Typography variant="body1">{author};&nbsp;</Typography>
              </Link>
            ))
          : authors.map((author) => (
              <Typography variant="body1" key={author}>
                {author};&nbsp;
              </Typography>
            ))}
        {count > MAX && (
          <Typography color="textSecondary" variant="body1">
            and {count - MAX} more
          </Typography>
        )}
      </Grid>
      {canShowAll && (
        <NoSsr
          fallback={
            <Link href={`${router.asPath}/authors`}>
              <Button size="small" variant="outlined">
                See All Authors
              </Button>
            </Link>
          }
        >
          <AuthorModal id={id} />
        </NoSsr>
      )}
    </>
  );
};

export interface IAuthorListProps {
  authors: string[];
  count: number;
  links?: boolean;
  id: string;
  canShowAll?: boolean;
}

export default AuthorList;
