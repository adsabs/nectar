import {
  Flex,
  FormControl,
  FormLabel,
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
  sliderValues: [label: string, value: number][];
  currentSliderValue: number;
  selectedWords?: string[];
}

export const WordCloudPane = ({
  wordData,
  fill,
  onSelect = noop,
  onSliderValueChange = noop,
  sliderValues,
  currentSliderValue,
  selectedWords = [],
}: IWordCloudPaneProps): ReactElement => {
  const handleSliderValueChange = (value: number) => {
    onSliderValueChange(value);
  };

  const { min, max } = useMemo(
    () => ({ min: sliderValues[0][1], max: sliderValues[sliderValues.length - 1][1] }),
    [sliderValues],
  );

  return (
    <Flex alignItems="center" direction="column">
      <FormControl my={10} w="100%">
        <Flex alignItems="center" direction="column">
          <FormLabel>Recalculate Cloud</FormLabel>
          <Slider
            defaultValue={currentSliderValue}
            onChangeEnd={handleSliderValueChange}
            min={min}
            max={max}
            step={1}
            my={10}
            w="96"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
            <SliderMark value={min} textAlign="center" mt={-10} ml={-5}>
              Unique
            </SliderMark>
            {sliderValues.map((sv) => (
              <SliderMark key={`slider-mark-${sv[1]}`} value={sv[1]} textAlign="center" mt={2} ml={-1}>
                {sv[0]}
              </SliderMark>
            ))}
            <SliderMark value={max} textAlign="center" mt={-10} ml={-5}>
              Frequent
            </SliderMark>
          </Slider>
        </Flex>
      </FormControl>

      <WordCloud wordData={wordData} fill={fill} onClickWord={onSelect} selectedWords={selectedWords} />
    </Flex>
  );
};
