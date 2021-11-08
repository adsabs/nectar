import Adsapi, { IUserData } from '@api';
import { useQuery } from 'react-query';

export const useBootstrap = (userData: IUserData, onSuccess: (data: IUserData) => void): void => {
  useQuery<IUserData>(['bootstrap'], fetchBootstrap, {
    onSuccess,
    enabled: !Adsapi.isValid(userData),
  });
};

const fetchBootstrap = async (): Promise<IUserData> => {
  const result = await Adsapi.bootstrap();
  return result.match(
    (response) => {
      const { access_token, username, anonymous, expire_in } = response.data;
      return { access_token, username, anonymous, expire_in };
    },
    (e) => {
      throw new Error(e.message);
    },
  );
};
