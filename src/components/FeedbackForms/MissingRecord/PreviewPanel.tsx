import { Button, HStack, Table, Tbody, Td, Text, Tr } from '@chakra-ui/react';
import { AuthorsTable } from './AuthorsTable';
import { ReferencesTable } from './ReferencesTable';
import { IFormData } from './types';
import { URLTable } from './URLTable';

export const PreviewPanel = ({
  name,
  email,
  data,
  onBack,
  onSubmit,
}: {
  name: string;
  email: string;
  data: IFormData;
  onBack: () => void;
  onSubmit: () => void;
}) => {
  const {
    record,
    collections,
    title,
    authors,
    publication,
    publicationDate,
    urls,
    abstract,
    keywords,
    references,
    comment,
  } = data;

  return (
    <>
      <Table size="md" variant="unstyled">
        <Tbody>
          <Tr>
            <Td fontWeight="bold">Submitter</Td>
            <Td>
              <Text>{name}</Text>
              <Text>{email}</Text>
            </Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">Bibcode</Td>
            <Td>{record}</Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">Collections</Td>
            <Td>{collections && collections.join(', ')}</Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">Title</Td>
            <Td>{title}</Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">Authors</Td>
            <Td>{authors && authors.length > 0 && <AuthorsTable authors={authors} editable={false} />}</Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">Publication</Td>
            <Td>{publication}</Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">Publication Date</Td>
            <Td>{publicationDate.toDateString()}</Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">URLs</Td>
            <Td>{urls && urls.length > 0 && <URLTable urls={urls} editable={false} />}</Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">Abstract</Td>
            <Td>{abstract}</Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">Keywords</Td>
            <Td>{keywords && keywords.join(', ')}</Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">References</Td>
            <Td>
              {references && references.length > 0 && <ReferencesTable references={references} editable={false} />}
            </Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">User Comments</Td>
            <Td>{comment}</Td>
          </Tr>
        </Tbody>
      </Table>
      <HStack mt={2}>
        <Button onClick={onSubmit}>Submit</Button>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </HStack>
    </>
  );
};
