import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
} from '@chakra-ui/react';
import { ReactElement } from 'react';
import { WordCloud, WordDatum } from '../Graphs';

export interface IWordCloudPaneProps {
  wordData: WordDatum[];
}

export const WordCloudPane = ({ wordData }: IWordCloudPaneProps): ReactElement => {
  return (
    <>
      <FormControl m={5}>
        <HStack gap={10}>
          <FormLabel>Recalculate Cloud</FormLabel>
          <Slider defaultValue={50} min={0} max={100} step={25} mt={10} w="96">
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
            <SliderMark value={0} textAlign="center" mt={-10} ml={-5}>
              Unique
            </SliderMark>
            <SliderMark value={0} textAlign="center" mt={2} ml={-1}>
              1
            </SliderMark>
            <SliderMark value={25} textAlign="center" mt={2} ml={-1}>
              2
            </SliderMark>
            <SliderMark value={50} textAlign="center" mt={2} ml={-1}>
              3
            </SliderMark>
            <SliderMark value={75} textAlign="center" mt={2} ml={-1}>
              4
            </SliderMark>
            <SliderMark value={100} textAlign="center" mt={2} ml={-1}>
              5
            </SliderMark>
            <SliderMark value={100} textAlign="center" mt={-10} ml={-5}>
              Frequent
            </SliderMark>
          </Slider>
        </HStack>
      </FormControl>
      <WordCloud wordData={wordData}></WordCloud>
    </>
  );
};
