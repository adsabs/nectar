import { useSession } from '@/lib/SessionProvider';

export const useGetUserEmail = () => {
  const { user } = useSession();
  return user?.name;
};
