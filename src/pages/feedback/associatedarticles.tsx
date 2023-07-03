import { Text } from '@chakra-ui/react';
import { AssociatedArticlesForm, FeedbackLayout } from '@components';
import { NextPage } from 'next';

const AssociatedArticles: NextPage = () => {
  return (
    <FeedbackLayout title="Submit Associated Articles for the SciX Abstract Service">
      <Text my={2}>
        Use this form to submit correlated articles (errata, multiple part articles, etc) with other articles in the
        SciX. For instance:
      </Text>
      <Text my={2}>
        <strong>1999ApJ...511L..65Y</strong>: Erratum: An X-Ray Microlensing Test of AU-Scale Accretion Disk Structure
        in Q2237+0305
      </Text>
      <Text my={2}>is an erratum for: </Text>
      <Text my={2}>
        <strong>1998ApJ...501L..41Y</strong>: An X-Ray Microlensing Test of AU-Scale Accretion Disk Structure in
        Q2237+0305
      </Text>
      <Text my={2}>
        Such associated references are connected with links in the SciX database. If you know of any correlated
        references (errata, multiple part articles, etc) that do not have such links, please let us know about them by
        filling in the codes for these correlated articles in this form. The form accepts one bibcode for the main paper
        and one or more bibcodes for the associated articles. Use the "Add a Record" button to enter multiple records.
      </Text>
      <AssociatedArticlesForm />
    </FeedbackLayout>
  );
};

export default AssociatedArticles;
