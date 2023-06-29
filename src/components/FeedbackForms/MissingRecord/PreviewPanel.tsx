import { Table, Tbody, Td, Text, Tr } from '@chakra-ui/react';
import { AuthorsTable } from './AuthorsTable';
import { ReferencesTable } from './ReferencesTable';
import { FormValues } from './types';
import { URLTable } from './URLTable';

export const PreviewPanel = ({ data }: { data: FormValues }) => {
  const {
    name,
    email,
    bibcode,
    collection,
    title,
    authors,
    publications,
    pubDate,
    urls,
    abstract,
    keywords,
    references,
    comments,
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
            <Td>{bibcode}</Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">Collections</Td>
            <Td>{collection && collection.join(', ')}</Td>
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
            <Td>{publications}</Td>
          </Tr>
          <Tr>
            <Td fontWeight="bold">Publication Date</Td>
            <Td>{pubDate.toDateString()}</Td>
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
            <Td>{comments}</Td>
          </Tr>
        </Tbody>
      </Table>
    </>
  );
};
