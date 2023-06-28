import { Text } from '@chakra-ui/react';
import { feedbackItems, FeedbackLayout, MissingReferenceForm, SimpleLink } from '@components';
import { NextPage } from 'next';

const MissingReferences: NextPage = () => {
  return (
    <FeedbackLayout title="Submit missing references for SciX Abstract Service">
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
      <MissingReferenceForm />
    </FeedbackLayout>
  );
};

export default MissingReferences;
