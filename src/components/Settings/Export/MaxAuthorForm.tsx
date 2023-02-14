import { Accordion, AccordionItem, AccordionButton, AccordionIcon, AccordionPanel, Stack, Box } from '@chakra-ui/react';
import { maxAuthorDescription } from './Description';
import { NumberSlider } from './NumberSlider';

export interface IMaxAuthorFormProps {
  label: string;
  maxAuthorMin: number;
  maxAuthorMax: number;
  maxAuthorValue: number;
  cutoffMin: number;
  cutoffMax: number;
  cutoffValue: number;
  onChangeMaxAuthor: (v: number) => void;
  onChangeCutoff: (v: number) => void;
}
export const MaxAuthorForm = ({
  label,
  maxAuthorMax,
  maxAuthorMin,
  maxAuthorValue,
  cutoffMax,
  cutoffMin,
  cutoffValue,
  onChangeCutoff,
  onChangeMaxAuthor,
}: IMaxAuthorFormProps) => {
  return (
    <Accordion allowToggle>
      <AccordionItem border="none">
        <AccordionButton pl={0} _hover={{ backgroundColor: 'transparent' }}>
          <Box fontWeight="bold">{label}</Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          {maxAuthorDescription}
          <Stack direction="column" p={5}>
            <NumberSlider
              min={cutoffMin}
              max={cutoffMax}
              value={cutoffValue}
              onChange={onChangeCutoff}
              label="Author Cutoff"
            />
            <NumberSlider
              min={maxAuthorMin}
              max={maxAuthorMax}
              value={maxAuthorValue}
              onChange={onChangeMaxAuthor}
              label="Max Authors"
            />
          </Stack>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};
