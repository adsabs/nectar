import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Button, HStack, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { OrcidInactiveLogo, OrcidLogo } from '@components';
import { isClaimedBySciX } from './Utils';

export interface IActionProps {
  profile: IOrcidProfileEntry;
  onAddClaim: () => void;
  onDeleteClaim: (putcode: IOrcidProfileEntry['putcode']) => void;
  onSyncToOrcid: () => void;
}

export const Actions = ({ profile, onAddClaim, onDeleteClaim, onSyncToOrcid }: IActionProps) => {
  const handleAddClaim = () => {
    onAddClaim();
  };

  const handleDeleteClaim = () => {
    onDeleteClaim(profile.putcode);
  };

  const handleSyncToOrcid = () => {
    onSyncToOrcid();
  };

  const claimedBySciX = isClaimedBySciX(profile);

  // TODO: is 'rejected' claimed by scix or not? should delete claim from scix be enabled?
  return (
    <>
      {profile.status ? (
        <Menu>
          <MenuButton as={Button} variant="outline" rightIcon={<ChevronDownIcon />} color="gray.500">
            <HStack spacing={1}>
              <OrcidLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
              <span>Actions</span>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem isDisabled={!claimedBySciX} onClick={handleSyncToOrcid}>
              Sync to ORCiD
            </MenuItem>
            <MenuItem isDisabled={claimedBySciX || profile.status === 'rejected'} onClick={handleAddClaim}>
              Claim from SciX
            </MenuItem>
            <MenuItem isDisabled={!claimedBySciX} onClick={handleDeleteClaim}>
              Delete claim from SciX
            </MenuItem>
          </MenuList>
        </Menu>
      ) : (
        <Button variant="outline" color="gray.500" onClick={handleAddClaim}>
          <HStack spacing={1}>
            <OrcidInactiveLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
            <span>Claim</span>
          </HStack>
        </Button>
      )}
    </>
  );
};
