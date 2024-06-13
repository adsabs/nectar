import { isUserData } from '@/api';
import { useStore } from '@/store';

export const useGetUserEmail = () => {
  const user = useStore((state) => state.user);

  // if user is valid and authenticated, then return the email, otherwise return null
  if (isUserData(user) && !user.anonymous) {
    return user.username;
  }
  return null;
};
