import {
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
import { noop } from '@utils';
import { ReactElement, useMemo } from 'react';
import { WordCloud, WordDatum } from '../Graphs';

export interface IWordCloudPaneProps {
  wordData: WordDatum[];
  fill: d3.ScaleLogarithmic<string, string, never>;
  onSelect?: (word: string) => void;
  onSliderValueChange?: (value: number) => void;
  sliderValues: number[];
  currentSliderValue: number;
}

export const WordCloudPane = ({
  wordData,
  fill,
  onSelect = noop,
  onSliderValueChange = noop,
  sliderValues,
  currentSliderValue,
}: IWordCloudPaneProps): ReactElement => {
  const handleSliderValueChange = (value: number) => {
    onSliderValueChange(value);
  };

  const { min, max } = useMemo(
    () => ({ min: sliderValues[0], max: sliderValues[sliderValues.length - 1] }),
    [sliderValues],
  );

  return (
    <>
      <FormControl my={10}>
        <HStack gap={10}>
          <FormLabel>Recalculate Cloud</FormLabel>
          <Slider
            defaultValue={currentSliderValue}
            onChangeEnd={handleSliderValueChange}
            min={min}
            max={max}
            step={1}
            mt={10}
            w="96"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
            <SliderMark value={sliderValues[0]} textAlign="center" mt={-10} ml={-5}>
              Unique
            </SliderMark>
            {sliderValues.map((sv) => (
              <SliderMark value={sv} textAlign="center" mt={2} ml={-1}>
                {sv}
              </SliderMark>
            ))}
            <SliderMark value={sliderValues[sliderValues.length - 1]} textAlign="center" mt={-10} ml={-5}>
              Frequent
            </SliderMark>
          </Slider>
        </HStack>
      </FormControl>
      <Flex justifyContent="center">
        <WordCloud wordData={wordData} fill={fill} onSelect={onSelect} />
      </Flex>
    </>
  );
};
