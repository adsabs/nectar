import { Flex, FormControl, FormLabel, HStack, Input, Button, Text, Box } from '@chakra-ui/react';
import { FeedbackLayout, Select, SelectOption } from '@components';
import { NextPage } from 'next';

const relationOptions: SelectOption<string>[] = [
  { id: 'errata', value: 'errata', label: 'Main paper/Errata' },
  { id: 'addenda', value: 'addenda', label: 'Main paper/Addenda' },
  { id: 'series', value: 'series', label: 'Series of Articles' },
  { id: 'arxiv', value: 'arxiv', label: 'arXiv/Published' },
  { id: 'other', value: 'other', label: 'Other' },
];

const AssociatedArticles: NextPage = () => {
  return (
    <FeedbackLayout title="Submit Associated Articles for the ADS Abstract Service">
      <Text my={2}>
        Use this form to submit correlated articles (errata, multiple part articles, etc) with other articles in the
        ADS. For instance:
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
        Such associated references are connected with links in the ADS database. If you know of any correlated
        references (errata, multiple part articles, etc) that do not have such links, please let us know about them by
        filling in the codes for these correlated articles in this form. The form accepts one bibcode for the main paper
        and one or more bibcodes for the associated articles. Use the "Add a Record" button to enter multiple records.
      </Text>
      <Box as="form" my={2}>
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
            <FormLabel>Relation Type</FormLabel>
            <Select
              options={relationOptions}
              name="relation-type"
              label="Relation Type"
              id="relation-options"
              stylesTheme="default"
            />
          </FormControl>
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

export default AssociatedArticles;
