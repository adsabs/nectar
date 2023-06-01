import { Button, HStack, Text, Tooltip } from '@chakra-ui/react';
import { OrcidInactiveLogo, OrcidLogo } from '@components/images';

export interface ISimpleActionProps {
  isClaimed: boolean;
  onAddClaim: () => void;
  onDeleteClaim: () => void;
}

// if status is null,
export const SimpleAction = ({ isClaimed, onAddClaim, onDeleteClaim }: ISimpleActionProps) => {
  return (
    <>
      {!isClaimed ? (
        <Tooltip label="Claim from SciX">
          <Button variant="outline" size="xs" color="gray.500" onClick={onAddClaim} mr={1}>
            <HStack spacing={1}>
              <OrcidInactiveLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
              <Text fontSize="xs">Claim</Text>
            </HStack>
          </Button>
        </Tooltip>
      ) : (
        <Tooltip label="Delete claim from SciX">
          <Button variant="outline" size="xs" color="gray.500" onClick={onDeleteClaim} mr={1}>
            <HStack spacing={1}>
              <OrcidLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
              <Text fontSize="xs">Delete Claim</Text>
            </HStack>
          </Button>
        </Tooltip>
      )}
    </>
  );
};
