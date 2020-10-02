import Link from '@components/Link';
import { Breadcrumbs as MuiBreadcrumbs } from '@material-ui/core';
import { useRouter } from 'next/router';

const Breadcrumbs: React.FC = () => {
  const router = useRouter();
  console.log(router);

  return (
    <MuiBreadcrumbs>
      <Link href="/search/query">Search</Link>
      <Link href="/search/query">Search</Link>
      <Link href="/search/query">Search</Link>
    </MuiBreadcrumbs>
  );
};

export default Breadcrumbs;
