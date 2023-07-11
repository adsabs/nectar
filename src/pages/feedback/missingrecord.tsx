import {
  Flex,
  HStack,
  Text,
  Tab,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Button,
  useDisclosure,
  AlertStatus,
} from '@chakra-ui/react';
import { FeedbackLayout } from '@components';
import { FeedbackAlert, FormValues, JsonPreviewModal, PreviewPanel, RecordPanel } from '@components/FeedbackForms';
import { NextPage } from 'next';
import { useState } from 'react';

export { injectSessionGSSP as getServerSideProps } from '@ssrUtils';

const Record: NextPage = () => {
  const [alertDetails, setAlertDetails] = useState<{ status: AlertStatus; title: string; description?: string }>({
    status: 'success',
    title: '',
  });

  // TODO: diff view

  const { isOpen: isAlertOpen, onClose: onAlertClose, onOpen: onAlertOpen } = useDisclosure();

  const [isNew, setIsNew] = useState(true);
  const [preview, setPreview] = useState<FormValues>(null);

  // data from record panel on preview, saved and passed to record panel if user comes back after preview
  const [savedForm, setSavedForm] = useState<FormValues>(undefined);
  const { isOpen, onOpen, onClose } = useDisclosure(); // for opening json view

  const handleTabChange = (i: number) => {
    setIsNew(i === 0);
  };

  // save form values for after returning from preview
  const handlePreview = (values: FormValues) => {
    console.log(values);
    setPreview(values);
  };

  const handleClosePreview = () => {
    setSavedForm(preview);
    setPreview(null);
  };

  const handleSubmit = () => {
    setAlertDetails({
      status: 'success',
      title: 'Feedback successfully submitted',
    });
    onAlertOpen();
    setPreview(null);
    setSavedForm(undefined);
  };

  const alert = (
    <FeedbackAlert
      isOpen={isAlertOpen}
      onClose={onAlertClose}
      status={alertDetails.status}
      title={alertDetails.title}
      description={alertDetails.description}
      my={4}
    />
  );

  return (
    <FeedbackLayout title="Submit or Correct an Abstract for the SciX Abstract Service" alert={alert}>
      <Text my={2}>
        Please use the following form to submit a new bibliographic record to ADS or correct an existing record.
      </Text>

      <Flex direction="column" gap={4} my={2}>
        {!preview ? (
          <Tabs variant="enclosed-colored" onChange={handleTabChange} mt={5} size="lg" index={isNew ? 0 : 1}>
            <TabList role="tablist">
              <Tab role="tab" aria-selected={isNew}>
                New Record
              </Tab>
              <Tab role="tab" aria-selected={!isNew}>
                Edit Record
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel p={5} pt={8} role="tabpanel">
                <RecordPanel
                  isNew
                  onPreview={handlePreview}
                  initialFormValues={isNew && savedForm ? savedForm : undefined}
                />
              </TabPanel>
              <TabPanel p={5} pt={8} role="tabpanel">
                <RecordPanel
                  isNew={false}
                  onPreview={handlePreview}
                  initialFormValues={!isNew && savedForm ? savedForm : undefined}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        ) : (
          <Flex direction="column" alignItems="start">
            <Button my={2} variant="link" onClick={onOpen}>
              View in JSON format
            </Button>
            <PreviewPanel data={preview} />
            <HStack mt={2}>
              <Button onClick={handleSubmit}>Submit</Button>
              <Button variant="outline" onClick={handleClosePreview}>
                Back
              </Button>
            </HStack>
            <JsonPreviewModal data={preview} isOpen={isOpen} onClose={onClose} />
          </Flex>
        )}
      </Flex>
    </FeedbackLayout>
  );
};

export default Record;
