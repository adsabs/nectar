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
import { ChangeEventHandler, FC } from 'react';

interface ISearchInputProps extends InputGroupProps {
  search: string;
  onSearchChange: (search: string) => void;
}

const label = 'Search (case-sensitive)';

export const SearchInput: FC<ISearchInputProps> = (props) => {
  const { search, onSearchChange, ...inputGroupProps } = props;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (ev) => {
    const value = ev.currentTarget.value;
    onSearchChange(value);
  };

  const handleClear = () => onSearchChange('');

  return (
    <FormControl>
      <FormLabel>
        <VisuallyHidden>{label}</VisuallyHidden>
      </FormLabel>
      <InputGroup size="sm" {...inputGroupProps}>
        <Input value={search} pr="2.5rem" type="text" placeholder={label} onChange={handleChange} />
        <InputRightElement width="2.5rem">
          <CloseButton h="1.75rem" size="sm" onClick={handleClear} />
        </InputRightElement>
      </InputGroup>
    </FormControl>
  );
};
