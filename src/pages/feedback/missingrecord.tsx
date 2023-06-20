import {
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Button,
  Text,
  Box,
  Tab,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { FeedbackLayout } from '@components';
import { RecordPanel } from '@components/FeedbackForms';
import { NextPage } from 'next';

const Record: NextPage = () => {
  return (
    <FeedbackLayout title="Submit or Correct an Abstract for the ADS Abstract Service">
      <Text my={2}>
        Please use the following form to submit a new bibliographic record to ADS or correct an existing record.
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
              <Input type="email"></Input>
            </FormControl>
          </HStack>
          <Tabs variant="soft-rounded">
            <TabList>
              <Tab>New Record</Tab>
              <Tab>Edit Record</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <RecordPanel />
              </TabPanel>
              <TabPanel>
                <RecordPanel />
              </TabPanel>
            </TabPanels>
          </Tabs>
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

export default Record;
