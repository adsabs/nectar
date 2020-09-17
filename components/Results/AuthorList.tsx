import { Typography } from '@material-ui/core';
import Link from 'next/link';
import React from 'react';

const MAX = 10;
const AuthorList: React.FC<IAuthorListProps> = ({ authors, count, links }) => {
  const handleClickMore = () => console.log('more');
  return (
    <>
      {links
        ? authors.map((author) => (
            <Link
              href={`/search/query?q=author:"${author}"`}
              key={author}
              passHref
            >
              <Typography variant="body1" component="a">
                {author};&nbsp;
              </Typography>
            </Link>
          ))
        : authors.map((author) => (
            <Typography variant="body1" key={author}>
              {author};&nbsp;
            </Typography>
          ))}
      {count > MAX &&
        (process.browser ? (
          <Typography
            component="button"
            variant="body1"
            onClick={handleClickMore}
          >
            and {count - MAX} more
          </Typography>
        ) : (
          <Typography variant="body1">and {count - MAX} more</Typography>
        ))}
    </>
  );
};

// const AuthorListDynamic: React.FC<IAuthorListProps> = ({ authors, count }) => {
//   const handleClickMore = () => console.log('more');

//   return (
//     <>
//       {authors.map((author) => (
//         <Typography variant="body1" key={author}>
//           {author};&nbsp;
//         </Typography>
//       ))}
//       {count > MAX && (
//         <Typography
//           component="button"
//           variant="body1"
//           onClick={handleClickMore}
//         >
//           and {count - MAX} more
//         </Typography>
//       )}
//     </>
//   );
// };

// const AuthorListStatic: React.FC<IAuthorListProps> = ({ authors, count }) => {
//   return (
//     <>
//       {authors.map((author) => (
//         <Typography variant="body1" key={author}>
//           {author};&nbsp;
//         </Typography>
//       ))}
//       {count > MAX && (
//         <Typography variant="body1">and {count - MAX} more</Typography>
//       )}
//     </>
//   );
// };

// const AuthorList: React.FC<IAuthorListProps> = (props) => {
//   return (
//     <NoScript
//       component={<AuthorListDynamic {...props} />}
//       fallbackComponent={<AuthorListStatic {...props} />}
//     />
//   );
// };

export interface IAuthorListProps {
  authors: string[];
  count: number;
  id: string;
  links?: boolean;
}

export default AuthorList;

// const MAX = 10;
// const AuthorList: React.FC<{
//   authors: string[];
//   count: number;
//   id: string;
// }> = ({ id, authors, count }) => {
//   const [full, setFull] = React.useState(false);
//   const { data, refetch } = useSearch(id);

//   React.useEffect(() => {
//     if (data) {
//       setFull(true);
//     }
//   }, [data]);

//   const handleClickMore = () => refetch();

//   const handleClickLess = () => setFull(false);

//   if (full) {
//     return (
//       <>
//         {data?.docs?.[0].author.map((author) => (
//           <Typography variant="body1" key={author}>
//             {author};&nbsp;
//           </Typography>
//         ))}

//         <Link component="button" variant="body1" onClick={handleClickLess}>
//           show less
//         </Link>
//       </>
//     );
//   }
//   return (
//     <>
//       {authors.map((author) => (
//         <Typography variant="body1" key={author}>
//           {author};&nbsp;
//         </Typography>
//       ))}
//       {count > MAX && (
//         <Link component="button" variant="body1" onClick={handleClickMore}>
//           and {count - MAX} more
//         </Link>
//       )}
//     </>
//   );
// };

// export default AuthorList;

// const useSearch = (id: string) => {
//   const query = `id:${id}`;
//   const fields = 'id,author';

//   return useQuery(
//     [`author_${id}_search`, { query, fields }],
//     async (key, { query, fields }) => {
//       const { data } = await axios.get<SearchResult>('/api/search', {
//         params: { q: query, fl: fields },
//       });
//       return data;
//     },
//     { refetchOnWindowFocus: false, retry: false, enabled: false }
//   );
// };
