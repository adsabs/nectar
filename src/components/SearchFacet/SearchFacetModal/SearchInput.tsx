import { CloseButton, Input, InputGroup, InputGroupProps, InputRightElement } from '@chakra-ui/react';
import { ChangeEventHandler, FC } from 'react';

interface ISearchInputProps extends InputGroupProps {
  search: string;
  onSearchChange: (search: string) => void;
}

export const SearchInput: FC<ISearchInputProps> = (props) => {
  const { search, onSearchChange, ...inputGroupProps } = props;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (ev) => {
    const value = ev.currentTarget.value;
    onSearchChange(value);
  };

  const handleClear = () => onSearchChange('');

  return (
    <InputGroup size="sm" {...inputGroupProps}>
      <Input value={search} pr="2.5rem" type="text" placeholder="Filter results" onChange={handleChange} />
      <InputRightElement width="2.5rem">
        <CloseButton h="1.75rem" size="sm" onClick={handleClear} />
      </InputRightElement>
    </InputGroup>
  );
};
