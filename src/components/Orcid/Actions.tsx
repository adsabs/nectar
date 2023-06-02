import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Button, HStack, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { OrcidInactiveLogo, OrcidLogo } from '@components';
import { isClaimedBySciX, isInSciX } from './Utils';

export interface IActionProps {
  profile: IOrcidProfileEntry;
  onAddClaim: (identifier: string) => void;
  onDeleteClaim: (identifier: string) => void;
  onSyncToOrcid: (identifier: string) => void;
}

export const Actions = ({ profile, onAddClaim, onDeleteClaim, onSyncToOrcid }: IActionProps) => {
  const handleAddClaim = () => {
    onAddClaim(profile.identifier);
  };

  const handleDeleteClaim = () => {
    onDeleteClaim(profile.identifier);
  };

  const handleSyncToOrcid = () => {
    onSyncToOrcid(profile.identifier);
  };

  const claimedBySciX = isClaimedBySciX(profile);

  const inSciX = isInSciX(profile);

  return (
    <>
      {profile.status ? (
        <Menu>
          <MenuButton as={Button} variant="outline" rightIcon={<ChevronDownIcon />} color="gray.500" w={28}>
            <HStack spacing={1}>
              <OrcidLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
              <span>Actions</span>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem isDisabled={!inSciX || !claimedBySciX} onClick={handleSyncToOrcid}>
              Sync to ORCiD
            </MenuItem>
            <MenuItem isDisabled={!inSciX || claimedBySciX} onClick={handleAddClaim}>
              Claim from SciX
            </MenuItem>
            <MenuItem isDisabled={!inSciX || !claimedBySciX} onClick={handleDeleteClaim}>
              Delete claim from SciX
            </MenuItem>
          </MenuList>
        </Menu>
      ) : (
        <Button variant="outline" color="gray.500" onClick={handleAddClaim} w={28}>
          <HStack spacing={1}>
            <OrcidInactiveLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
            <span>Claim</span>
          </HStack>
        </Button>
      )}
    </>
  );
};
