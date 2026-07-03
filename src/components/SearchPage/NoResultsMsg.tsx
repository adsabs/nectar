import { Flex, List, ListIcon, ListItem } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';

import { CustomInfoMessage } from '@/components/Feedbacks';
import { SimpleLink } from '@/components/SimpleLink';

export const NoResultsMsg = () => (
  <CustomInfoMessage
    status="info"
    alertTitle={<>Sorry no results were found</>}
    description={
      <List w="100%">
        <ListItem>
          <ListIcon as={CheckCircleIcon} color="green.500" />
          Try broadening your search
        </ListItem>
        <ListItem>
          <ListIcon as={CheckCircleIcon} color="green.500" />
          Disable any filters that may be applied
        </ListItem>
        <ListItem>
          <Flex direction="row" alignItems="center">
            <ListIcon as={CheckCircleIcon} color="green.500" />
            <SimpleLink href="/">Check out some examples</SimpleLink>
          </Flex>
        </ListItem>
        <ListItem>
          <Flex direction="row" alignItems="center">
            <ListIcon as={CheckCircleIcon} color="green.500" />
            <SimpleLink href="/help/search/search-syntax" newTab={true}>
              Read our help pages
            </SimpleLink>
          </Flex>
        </ListItem>
      </List>
    }
  />
);
