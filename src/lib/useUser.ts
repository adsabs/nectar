import { useStore } from '@/store';
import { useQueryClient } from '@tanstack/react-query';

export const useUser = () => {
  const user = useStore((state) => state.user);
  const resetUser = useStore((state) => state.resetUser);
  const resetUserSettings = useStore((state) => state.resetUserSettings);
  const queryClient = useQueryClient();

  const reset = async () => {
    resetUserSettings();
    resetUser();
    await queryClient.invalidateQueries(['user'], { exact: true });
  };

  return {
    user,
    reset,
    resetUser,
    resetUserSettings,
  };
};
