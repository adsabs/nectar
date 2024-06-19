import { Flex, FormControl, FormLabel } from '@chakra-ui/react';
import { Slider } from '@/components/Slider';
import { noop } from '@/utils';
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
  const handleSliderValueChange = (value: number[]) => {
    onSliderValueChange(value[0]);
  };

  const { min, max } = useMemo(
    () => ({ min: sliderValues[0][1], max: sliderValues[sliderValues.length - 1][1] }),
    [sliderValues],
  );

  return (
    <Flex alignItems="center" direction="column">
      <FormControl my={10} w={400}>
        <Flex alignItems="center" direction="column">
          <FormLabel>Recalculate Cloud</FormLabel>
          <Slider
            aria-label="unique frequent slider"
            range={[min, max]}
            values={[currentSliderValue]}
            onSlideEnd={handleSliderValueChange}
            px={4}
            mt={1}
            size={1}
            ticks={sliderValues}
          />
        </Flex>
      </FormControl>

      <WordCloud wordData={wordData} fill={fill} onClickWord={onSelect} selectedWords={selectedWords} />
    </Flex>
  );
};
