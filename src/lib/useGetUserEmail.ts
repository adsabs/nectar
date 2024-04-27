import { useStore } from '@/store';

export const useGetUserEmail = () => {
  const username = useStore((state) => state.user.username);
  return username !== 'anonymous@ads' ? username : null;
};
