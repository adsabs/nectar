import { Box, Text, TextProps } from '@chakra-ui/react';
import { ReactJSXElement } from '@emotion/react/types/jsx-namespace';
import { useColorModeColors } from '@/lib';
import { ArrayChange, Change } from 'diff';
import { DiffSection } from './types';

interface IDiffSectionPanelProps {
  section: DiffSection;
}

export const DiffSectionPanel = ({ section }: IDiffSectionPanelProps) => {
  const { type, changes, newValue, label } = section;

  return (
    <Box>
      <Box as="section" border="1px" borderColor="blue.200">
        <Box backgroundColor="blue.100" p={2} fontWeight="semibold" color="gray.700">
          {label}
        </Box>
        <Box p={2}>
          {type === 'array' ? (
            <ArrayChanges label={label} changes={changes as ArrayChange<string>[]} />
          ) : (
            <TextChanges changes={changes as Change[]} newValue={newValue} />
          )}
        </Box>
      </Box>
    </Box>
  );
};

const ArrayChanges = ({ label, changes }: { label: string; changes: ArrayChange<string>[] }) => {
  let i = 0;
  return (
    <>
      {changes.reduce<ReactJSXElement[]>((val, change) => {
        if (change.added) {
          const currentCount = i;
          i += change.count || 0;
          return [
            ...val,
            ...change.value.map((v, idx) => (
              <Add key={`add-${label}-${idx + currentCount}`} value={`+ ${idx + currentCount + 1} ${v}`} />
            )),
          ];
        } else if (change.removed) {
          return [
            ...val,
            ...change.value.map((v, idx) => <Remove key={`rm-${label}-${i + idx}`} value={`- ${i + idx + 1} ${v}`} />),
          ];
        }
        i += change.count || 0;
        return [...val, <Text key={`text-${label}-${i}`}>...</Text>];
      }, [])}
    </>
  );
};

const TextChanges = ({ changes, newValue }: { changes: Change[]; newValue: string }) => {
  const colors = useColorModeColors();

  let i = 0;
  return (
    <>
      <Text fontWeight="bold">Diff:</Text>
      {changes.reduce<ReactJSXElement[]>((list, change) => {
        if (change.added) {
          return [...list, <Add value={change.value} display="inline" key={`textadd-${i++}`} />];
        } else if (change.removed) {
          return [...list, <Remove value={change.value} display="inline" key={`textrm-${i++}`} />];
        }
        return [
          ...list,
          <Text display="inline" key={`text-${i}`}>
            {change.value}
          </Text>,
        ];
      }, [])}
      <br />
      <br />
      <Text fontWeight="bold">Updated:</Text>
      <Box backgroundColor={colors.panel} p={4} mt={2}>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{newValue}</pre>
      </Box>
    </>
  );
};

interface IDiffLineProps extends TextProps {
  value: string;
}

const Add = ({ value, ...textProps }: IDiffLineProps) => {
  return (
    <Text {...textProps} color="green.500">
      {value}
    </Text>
  );
};

const Remove = ({ value, ...textProps }: IDiffLineProps) => {
  return (
    <Text {...textProps} color="red.500">
      {value}
    </Text>
  );
};
