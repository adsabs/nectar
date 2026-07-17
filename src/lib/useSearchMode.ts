import { useStore } from '@/store';

export const useSearchMode = () => {
  const searchMode = useStore((s) => s.searchMode);
  const setSearchMode = useStore((s) => s.setSearchMode);
  return [searchMode, setSearchMode] as const;
};
