import { Flex, Text, Tab, Tabs, TabList, TabPanels, TabPanel, useDisclosure, AlertStatus } from '@chakra-ui/react';
import { FeedbackLayout } from '@components';
import { FeedbackAlert, RecordPanel } from '@components/FeedbackForms';
import { NextPage } from 'next';
import { useMemo, useState } from 'react';

export { injectSessionGSSP as getServerSideProps } from '@ssrUtils';

const Record: NextPage = () => {
  const [alertDetails, setAlertDetails] = useState<{ status: AlertStatus; title: string; description?: string }>({
    status: 'success',
    title: '',
  });

  const [isNew, setIsNew] = useState(true);

  const handleTabChange = (i: number) => {
    setIsNew(i === 0);
  };

  const { isOpen: isAlertOpen, onClose: onAlertClose, onOpen: onAlertOpen } = useDisclosure();

  const alert = useMemo(
    () => (
      <FeedbackAlert
        isOpen={isAlertOpen}
        onClose={onAlertClose}
        status={alertDetails.status}
        title={alertDetails.title}
        description={alertDetails.description}
        my={4}
      />
    ),
    [alertDetails, isAlertOpen, onAlertClose, onAlertOpen],
  );

  const handleOnOpenAlert = ({
    status,
    title,
    description,
  }: {
    status: AlertStatus;
    title: string;
    description?: string;
  }) => {
    setAlertDetails({
      status,
      title,
      description,
    });
    onAlertOpen();
  };

  return (
    <FeedbackLayout title="Submit or Correct an Abstract for the SciX Abstract Service" alert={alert}>
      <Text my={2}>
        Please use the following form to submit a new bibliographic record to ADS or correct an existing record.
      </Text>

      <Flex direction="column" gap={4} my={2}>
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
              <RecordPanel isNew onOpenAlert={handleOnOpenAlert} isFocused={isNew} />
            </TabPanel>
            <TabPanel p={5} pt={8} role="tabpanel">
              <RecordPanel isNew={false} onOpenAlert={handleOnOpenAlert} isFocused={!isNew} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    </FeedbackLayout>
  );
};

export default Record;
