import { AlertStatus, Text, useDisclosure } from '@chakra-ui/react';
import { feedbackItems, FeedbackLayout, MissingReferenceForm, SimpleLink } from '@/components';
import { FeedbackAlert } from '@/components/FeedbackForms';
import { NextPage } from 'next';
import { useMemo, useState } from 'react';

const MissingReferences: NextPage = () => {
  const [alertDetails, setAlertDetails] = useState<{ status: AlertStatus; title: string; description?: string }>({
    status: 'success',
    title: '',
  });

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
    <FeedbackLayout title="Submit missing references for SciX Abstract Service" alert={alert}>
      <Text my={2}>Please use this form to submit one or more citations currently missing from our databases.</Text>
      <Text my={2}>
        In order to use this form you will need to know the bibcodes of the citing and cited papers, and enter them in
        the appropriate fields.
      </Text>
      <Text my={2}>
        If either the citing or cited paper is not in SciX you should
        <SimpleLink href={feedbackItems.record.path} display="inline">
          {' '}
          submit a record{' '}
        </SimpleLink>
        for it first.
      </Text>
      <MissingReferenceForm onOpenAlert={handleOnOpenAlert} />
    </FeedbackLayout>
  );
};

export default MissingReferences;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
