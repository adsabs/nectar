import { Box, Flex, FlexProps, RadioProps, useRadio, useRadioGroup } from '@chakra-ui/react';
import { head, range } from 'ramda';
import { FC, useMemo } from 'react';
import { parseTitleFromKey } from '../helpers';
import { FacetCountTuple } from '../types';

interface IAlphaSorterProps extends FlexProps {
  letter: string;
  onLetterChange: (letter: string) => void;
  treeData: FacetCountTuple[];
}

export const AlphaSorter: FC<IAlphaSorterProps> = (props) => {
  const { letter = 'All', onLetterChange, treeData, ...flexProps } = props;
  const { getRootProps, getRadioProps } = useRadioGroup({
    onChange: onLetterChange,
    value: letter,
  });

  const lettersFound = useMemo(() => treeData.map((val) => head(parseTitleFromKey(val[0]))), [treeData]);

  return (
    <Flex {...getRootProps()} {...flexProps}>
      <LetterRadio {...getRadioProps({ value: 'All' })} />
      {range(65, 91).map((i) => (
        <LetterRadio
          key={i}
          {...getRadioProps({ value: String.fromCharCode(i) })}
          isDisabled={!lettersFound.includes(String.fromCharCode(i))}
        />
      ))}
    </Flex>
  );
};

const LetterRadio = (props: RadioProps) => {
  const { getInputProps, getCheckboxProps } = useRadio(props);
  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="none"
        _disabled={{
          bg: 'gray.400',
        }}
        _checked={{
          bg: 'blue.600',
          color: 'white',
          borderColor: 'gray.200',
        }}
        _focus={{
          boxShadow: 'outline',
        }}
        py="0.5"
        px="2"
      >
        {props.value}
      </Box>
    </Box>
  );
};
