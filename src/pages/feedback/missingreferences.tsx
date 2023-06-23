import { Flex, FormControl, FormLabel, HStack, Input, Button, Text, Box } from '@chakra-ui/react';
import { feedbackItems, FeedbackLayout, SimpleLink } from '@components';
import { ReferencesTable } from '@components/FeedbackForms/MissingReferences';
import { useStore } from '@store';
import { NextPage } from 'next';
import { ChangeEvent, useState } from 'react';

const MissingReferences: NextPage = () => {
  const username = useStore((state) => state.getUsername());
  const [email, setEmail] = useState<string>(username ?? '');

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <FeedbackLayout title="Submit missing references for the ADS Abstract Service">
      <Text my={2}>Please use this form to submit one or more citations currently missing from our databases.</Text>
      <Text my={2}>
        In order to use this form you will need to know the bibcodes of the citing and cited papers, and enter them in
        the appropriate fields.
      </Text>
      <Text my={2}>
        If either the citing or cited paper is not in ADS you should
        <SimpleLink href={feedbackItems.record.path} display="inline">
          {' '}
          submit a record{' '}
        </SimpleLink>
        for it first.
      </Text>
      <Box as="form" my={2}>
        <Flex direction="column" gap={4}>
          <HStack gap={2}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input></Input>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input type="email" value={email} onChange={handleEmailChange}></Input>
            </FormControl>
          </HStack>
          <ReferencesTable />
          <HStack mt={2}>
            <Button type="submit">Submit</Button>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </HStack>
        </Flex>
      </Box>
    </FeedbackLayout>
  );
};

export default MissingReferences;
