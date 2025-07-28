import { Box, chakra, Flex, FlexProps, RadioProps, useRadio, useRadioGroup } from '@chakra-ui/react';
import { range } from 'ramda';
import { FC } from 'react';

interface IAlphaSorterProps extends FlexProps {
  letter: string;
  onLetterChange: (letter: string) => void;
}

export const AlphaSorter: FC<IAlphaSorterProps> = (props) => {
  const { letter = 'All', onLetterChange, ...flexProps } = props;
  const { getRootProps, getRadioProps } = useRadioGroup({
    onChange: onLetterChange,
    value: letter,
  });

  return (
    <Flex {...getRootProps()} {...flexProps}>
      <LetterRadio {...getRadioProps({ value: 'All' })} />
      {range(65, 91).map((i) => (
        <LetterRadio key={i} {...getRadioProps({ value: String.fromCharCode(i) })} />
      ))}
    </Flex>
  );
};

const LetterRadio = (props: Omit<RadioProps, 'onBeforeInput'>) => {
  const { getInputProps, htmlProps, getRadioProps, state, getLabelProps } = useRadio(props);

  return (
    <chakra.label {...htmlProps} cursor="pointer">
      <input {...getInputProps({})} hidden />
      <Box
        {...getRadioProps()}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="none"
        bg={state.isChecked ? 'blue.600' : 'transparent'}
        color={state.isChecked ? 'white' : 'gray.600'}
        borderColor={state.isChecked ? 'gray.200' : 'gray.300'}
        _disabled={{ bg: 'gray.400' }}
        _focus={{ boxShadow: 'outline' }}
        py="0.5"
        px="2"
      >
        <Box {...getLabelProps()}>{props.value}</Box>
      </Box>
    </chakra.label>
  );
};
