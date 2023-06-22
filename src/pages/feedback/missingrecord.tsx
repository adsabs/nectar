import {
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Text,
  Box,
  Tab,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { FeedbackLayout } from '@components';
import { IFormData, JsonPreviewModal, PreviewPanel, RecordPanel } from '@components/FeedbackForms';
import { NextPage } from 'next';
import { ChangeEvent, useState } from 'react';

const Record: NextPage = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [formData, setFormData] = useState<IFormData>(null);
  const [preview, setPreview] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure(); // for opening json view

  const handlePreview = (data: IFormData) => {
    setFormData(data);
    setPreview(true);
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleClosePreview = () => {
    setPreview(false);
  };

  const handleSubmit = () => {
    // TODO:
  };

  return (
    <>
      {!preview ? (
        <FeedbackLayout title="Submit or Correct an Abstract for the SciX Abstract Service">
          <Text my={2}>
            Please use the following form to submit a new bibliographic record to ADS or correct an existing record.
          </Text>
          <Box as="form" my={2}>
            <Flex direction="column" gap={4}>
              <HStack gap={2}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input value={name} onChange={handleNameChange} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input type="email" value={email} onChange={handleEmailChange} />
                </FormControl>
              </HStack>
              <Tabs variant="soft-rounded">
                <TabList>
                  <Tab>New Record</Tab>
                  <Tab>Edit Record</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <RecordPanel isNew onPreview={handlePreview} formData={formData} />
                  </TabPanel>
                  <TabPanel>
                    <RecordPanel isNew={false} onPreview={handlePreview} formData={formData} />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Flex>
          </Box>
        </FeedbackLayout>
      ) : (
        <FeedbackLayout title="Preview Submission for Abstract for the SciX Abstract Service">
          <Button my={2} variant="link" onClick={onOpen}>
            View in JSON format
          </Button>
          <PreviewPanel name={name} email={email} data={formData} onBack={handleClosePreview} onSubmit={handleSubmit} />
        </FeedbackLayout>
      )}
      <JsonPreviewModal name={name} email={email} data={formData} isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default Record;
