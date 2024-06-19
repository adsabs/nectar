import { Box, Button, Flex, FormControl, FormLabel, Input } from '@chakra-ui/react';
import { DescriptionCollapse } from '@/components/CitationExporter';
import { ChangeEvent, ReactElement, useEffect, useState } from 'react';

export const KeyFormatInputApply = ({
  format,
  label,
  description,
  onApply,
}: {
  format: string;
  label: string;
  description: ReactElement;
  onApply: (format: string) => void;
}) => {
  const [newFormat, setNewFormat] = useState(format);

  useEffect(() => {
    setNewFormat(format);
  }, [format]);

  const handleFormatInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewFormat(e.target.value);
  };

  const handleApply = () => {
    onApply(newFormat);
  };

  return (
    <DescriptionCollapse body={description} label={label}>
      {({ btn, content }) => (
        <FormControl>
          <Box mb="2">
            <FormLabel fontSize={['sm', 'md']}>
              {label} {btn}
            </FormLabel>
            {content}
          </Box>
          <Flex direction="row">
            <Input placeholder="%1H:%Y:%q" size="md" value={newFormat} onChange={handleFormatInputChange} />
            <Button size="md" borderStartRadius={0} onClick={handleApply} isDisabled={newFormat === format}>
              Apply
            </Button>
          </Flex>
        </FormControl>
      )}
    </DescriptionCollapse>
  );
};
