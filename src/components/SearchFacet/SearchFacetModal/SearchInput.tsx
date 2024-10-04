import {
  CloseButton,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputGroupProps,
  InputRightElement,
  VisuallyHidden,
} from '@chakra-ui/react';
import { useFacetStore } from '@/components/SearchFacet/store/FacetStore';
import { ChangeEventHandler, FC } from 'react';
import { capitalizeString } from '@/utils/common/formatters';

export interface ISearchInputProps extends InputGroupProps {
  search: string;
  onSearchChange: (search: string) => void;
  isDisabled?: boolean;
}

export const SearchInput: FC<ISearchInputProps> = (props) => {
  const { search, onSearchChange, isDisabled, ...inputGroupProps } = props;

  const forceUppercaseInitial = useFacetStore((state) => state.params.forceUppercaseInitial);

  const label = forceUppercaseInitial ? 'Search' : 'Search (case-sensitive)';
  const handleChange: ChangeEventHandler<HTMLInputElement> = (ev) => {
    // disallow forward slashes
    const value = ev.currentTarget.value.replaceAll('/', '');

    // if flag is set, this capitalizes the search term
    onSearchChange(forceUppercaseInitial ? capitalizeString(value) : value);
  };

  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <FormControl>
      <FormLabel>
        <VisuallyHidden>{label}</VisuallyHidden>
      </FormLabel>
      <InputGroup size="sm" {...inputGroupProps}>
        <Input
          value={search}
          pr="2.5rem"
          type="text"
          placeholder={label}
          onChange={handleChange}
          isDisabled={isDisabled}
        />
        <InputRightElement width="2.5rem">
          <CloseButton h="1.75rem" size="sm" onClick={handleClear} isDisabled={isDisabled} aria-label="clear search" />
        </InputRightElement>
      </InputGroup>
    </FormControl>
  );
};
