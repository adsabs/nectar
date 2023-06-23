import { Button, Flex, FormControl, FormLabel, Input, Textarea, Text, HStack } from '@chakra-ui/react';
import { FeedbackLayout } from '@components';
import { useStore } from '@store';
import { NextPage } from 'next';
import { useState, ChangeEvent } from 'react';

const General: NextPage = () => {
  const username = useStore((state) => state.getUsername());
  const [email, setEmail] = useState<string>(username ?? '');

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

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
              <Input type="email" value={email} onChange={handleEmailChange}></Input>
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
