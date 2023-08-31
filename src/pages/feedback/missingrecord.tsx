import { fetchSearch, getSingleRecordParams, searchKeys } from '@api';
import { AlertStatus, Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useDisclosure } from '@chakra-ui/react';
import { FeedbackLayout } from '@components';
import { FeedbackAlert, RecordPanel } from '@components/FeedbackForms';
import { GetServerSideProps, NextPage } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { composeNextGSSP } from '@ssr-utils';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';

const Record: NextPage = () => {
  const [alertDetails, setAlertDetails] = useState<{ status: AlertStatus; title: string; description?: string }>({
    status: 'success',
    title: '',
  });

  const [isNew, setIsNew] = useState(true);

  const router = useRouter();

  const { bibcode } = router.query;

  useEffect(() => {
    setIsNew(bibcode && typeof bibcode === 'string' ? false : true);
  }, [bibcode]);

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

  const handleOnCloseAlert = () => {
    onAlertClose();
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
              <RecordPanel isNew onOpenAlert={handleOnOpenAlert} isFocused={isNew} onCloseAlert={handleOnCloseAlert} />
            </TabPanel>
            <TabPanel p={5} pt={8} role="tabpanel">
              <RecordPanel
                isNew={false}
                onOpenAlert={handleOnOpenAlert}
                isFocused={!isNew}
                onCloseAlert={handleOnCloseAlert}
                bibcode={bibcode as string}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    </FeedbackLayout>
  );
};

export default Record;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  const { bibcode } = ctx.query;
  if (typeof bibcode === 'string') {
    const queryClient = new QueryClient();
    const params = getSingleRecordParams(bibcode);

    void (await queryClient.prefetchQuery({
      queryKey: searchKeys.record(bibcode),
      queryFn: fetchSearch,
      meta: { params },
    }));

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  }

  return { props: {} };
});
