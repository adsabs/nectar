import { kFormatNumber } from '@/utils/common/formatters';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Card, CardBody, Flex, Text } from '@chakra-ui/react';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { IExplorerFacet } from './types';

export const SubFacetCard = ({
  facet,
  recordCount,
  selected,
  onSelect,
}: {
  facet: IExplorerFacet;
  recordCount: number;
  selected: boolean;
  onSelect: (id: IExplorerFacet['id']) => void;
}) => {
  const colors = useColorModeColors();

  return (
    <Card
      minW={200}
      minH={150}
      bgImage={`url('${facet.image}')`}
      bgSize="cover"
      bgPosition="center"
      flex={1}
      cursor="pointer"
      transition="all 0.3s ease-in-out"
      position="relative"
      overflow="hidden"
      borderWidth={selected ? '10px' : '0'}
      borderColor={colors.outline}
      _before={{
        content: '""',
        position: 'absolute',
        inset: 0,
        bg: 'blackAlpha.300', // dark overlay
        transition: 'opacity 0.2s ease-in-out',
      }}
      _hover={{
        transform: 'scale(1.05)',
        zIndex: 1,
        boxShadow: 'xl',
        _before: { opacity: 0 }, // Fades out the dark overlay
      }}
      tabIndex={0}
      onClick={() => onSelect(facet.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(facet.id);
        }
      }}
    >
      <CardBody display="flex" alignItems="end" color="white" position="relative" zIndex={1}>
        <Flex justifyContent="space-between" alignItems="end" w="100%">
          <Flex direction="column">
            <Text fontSize="lg" fontWeight="bold">
              {facet.label}
            </Text>
            <Text fontSize="sm" fontWeight="normal">
              {kFormatNumber(recordCount)} records
            </Text>
          </Flex>
          <ArrowForwardIcon boxSize={5} />
        </Flex>
      </CardBody>
    </Card>
  );
};
