import { useRouter } from 'next/router';

export const useBackToSearchResults = () => {
  const router = useRouter();

  return {
    handleBack: router.back,
  };
};
