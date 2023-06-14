import { Button, Flex, FormControl, FormLabel, Input, Textarea, Text, HStack, Box } from '@chakra-ui/react';
import { FeedbackLayout } from '@components';
import { NextPage } from 'next';

const General: NextPage = () => {
  return (
    <FeedbackLayout title="General Feedback">
      <Text my={2}>
        You can also reach us at <strong>adshelp [at] cfa.harvard.edu</strong>
      </Text>
      <form>
        <Flex direction="column" gap={2}>
          <HStack gap={2}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input></Input>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input type="email"></Input>
            </FormControl>
          </HStack>
          <FormControl>
            <FormLabel>Feedback</FormLabel>
            <Textarea />
          </FormControl>
          <HStack mt={2}>
            <Button type="submit">Submit</Button>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </HStack>
        </Flex>
      </form>
    </FeedbackLayout>
  );
};

export default General;
