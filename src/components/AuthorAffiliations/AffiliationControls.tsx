/** ---------- Controls (left: actions, right: selects) ---------- */
import { ChangeEventHandler, Dispatch } from 'react';
import { useAuthorAffStore } from '@/components/AuthorAffiliations/store';
import { Button, Flex, FormControl, FormLabel, Select, Stack, VisuallyHidden, Wrap, WrapItem } from '@chakra-ui/react';
import { ExportModal } from '@/components/AuthorAffiliations/ExportModal';
import { countOptions } from '@/components/AuthorAffiliations/models';
import { AffTableAction, AffTableState } from '@/components/AuthorAffiliations/AuthorAffiliations';

export const AffiliationControls = ({
  formState,
  dispatch,
}: {
  formState: AffTableState;
  dispatch: Dispatch<AffTableAction>;
}) => {
  const isDisabled = useAuthorAffStore((s) => s.isLoading || s.items.length === 0);
  const reset = useAuthorAffStore((s) => s.reset);
  const toggleAll = useAuthorAffStore((s) => s.toggleAll);

  const handleYearChange: ChangeEventHandler<HTMLSelectElement> = (e) =>
    dispatch({ type: 'setNumYears', payload: Number(e.currentTarget.value) });

  const handleAuthorChange: ChangeEventHandler<HTMLSelectElement> = (e) =>
    dispatch({ type: 'setMaxAuthors', payload: Number(e.currentTarget.value) });

  return (
    <section aria-labelledby="modify-form-area" id="author-affiliation-content">
      <VisuallyHidden as="h3" id="modify-form-area">
        Modify Form Parameters
      </VisuallyHidden>

      {/* Mobile: column; md+: row spaced */}
      <Flex
        mt="2"
        mb="4"
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        gap={3}
      >
        {/* Left: action buttons */}
        <Stack direction="row" align="center">
          <Button size="xs" variant="ghost" onClick={toggleAll} isDisabled={isDisabled}>
            Toggle All
          </Button>
          <Button size="xs" variant="ghost" onClick={reset} isDisabled={isDisabled}>
            Reset
          </Button>
          <ExportModal isDisabled={isDisabled} />
        </Stack>

        {/* Right: selects; Wrap keeps them tidy at small widths */}
        <Wrap spacing="12px" justify={{ base: 'flex-start', md: 'flex-end' }}>
          <WrapItem>
            <FormControl minW="180px">
              <FormLabel>Max Authors</FormLabel>
              <Select onChange={handleAuthorChange} value={String(formState.maxAuthors)}>
                {countOptions.map((count) => (
                  <option value={count} key={count}>
                    {count}
                  </option>
                ))}
                <option value="0">All Authors</option>
              </Select>
            </FormControl>
          </WrapItem>
          <WrapItem>
            <FormControl minW="160px">
              <FormLabel>Years</FormLabel>
              <Select onChange={handleYearChange} value={String(formState.numYears)}>
                {countOptions.map((count) => (
                  <option value={count} key={count}>
                    {count}
                  </option>
                ))}
                <option value="0">All Years</option>
              </Select>
            </FormControl>
          </WrapItem>
        </Wrap>
      </Flex>
    </section>
  );
};
