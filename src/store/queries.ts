import Adsapi, { IUserData } from '@api';
import { identity } from 'ramda';
import { useQuery } from 'react-query';

export const useBootstrap = (onSuccess: (data: IUserData) => void): void => {
  useQuery<IUserData>(['bootstrap'], fetchBootstrap, { onSuccess });
};

const fetchBootstrap = async (): Promise<IUserData> => {
  const result = await Adsapi.bootstrap();
  return result.match(identity, (e) => {
    throw new Error(e.message);
  });
};
