import React from 'react';
import axios from 'axios';
import { Typography, Link } from '@material-ui/core';
import { SearchResult } from '@api/search';
import { useQuery } from 'react-query';

const MAX = 10;
const AuthorList: React.FC<{
  authors: string[];
  count: number;
  id: string;
}> = ({ id, authors, count }) => {
  const [full, setFull] = React.useState(false);

  const { data, refetch } = useSearch(id);

  React.useEffect(() => {
    if (data) {
      setFull(true);
    }
  }, [data]);

  const handleClickMore = () => refetch();

  const handleClickLess = () => setFull(false);

  if (full) {
    return (
      <>
        {data?.docs?.[0].author.map((author) => (
          <Typography variant="body1" key={author}>
            {author};&nbsp;
          </Typography>
        ))}

        <Link component="button" variant="body1" onClick={handleClickLess}>
          show less
        </Link>
      </>
    );
  }
  return (
    <>
      {authors.map((author) => (
        <Typography variant="body1" key={author}>
          {author};&nbsp;
        </Typography>
      ))}
      {count > MAX && (
        <Link component="button" variant="body1" onClick={handleClickMore}>
          and {count - MAX} more
        </Link>
      )}
    </>
  );
};

export default AuthorList;

const useSearch = (id: string) => {
  const query = `id:${id}`;
  const fields = 'id,author';

  return useQuery(
    [`author_${id}_search`, { query, fields }],
    async (key, { query, fields }) => {
      const { data } = await axios.get<SearchResult>('/api/search', {
        params: { q: query, fl: fields },
      });
      return data;
    },
    { refetchOnWindowFocus: false, retry: false, enabled: false }
  );
};
