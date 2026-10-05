import { kFormatNumber } from '@/utils/common/formatters';
import { Flex, Card, CardBody, Box, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { IExplorerCollection, IExplorerFacet } from './types';

export const ExplorerFacet = ({
  collection,
  facetItems,
  counts,
}: {
  collection: IExplorerCollection['id'];
  facetItems: IExplorerFacet[];
  counts: Record<IExplorerFacet['facetKey'], number>;
}) => {
  const router = useRouter();

  const handleSelectFacet = (facet: IExplorerFacet['facetKey']) => {
    router.push({ pathname: router.pathname, query: { collection, facet } });
  };

  return (
    <Flex gap={4} width="full" flexWrap="wrap">
      {facetItems.map((item) => (
        <Card
          key={`${item.label}`}
          minW={200}
          minH={100}
          flex={1}
          cursor="pointer"
          transition="all 0.3s ease-in-out"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
          _hover={{
            transform: 'scale(1.05)',
            zIndex: 1,
            boxShadow: 'xl',
          }}
          tabIndex={0}
          onClick={() => handleSelectFacet(item.facetKey)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectFacet(item.facetKey);
            }
          }}
        >
          <CardBody display="flex" position="relative" zIndex={1}>
            <Flex w="100%" alignItems="center">
              <Box as={item.icon} boxSize={12} mr={4} flexShrink={0} aria-hidden />
              <Flex direction="column">
                <Text fontSize="lg" fontWeight="bold">
                  {item.label}
                </Text>
                <Text fontSize="sm">{kFormatNumber(counts[item.facetKey] ?? 0)} records</Text>
              </Flex>
            </Flex>
          </CardBody>
        </Card>
      ))}
    </Flex>
  );
};
