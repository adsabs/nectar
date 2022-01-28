import { ItemType } from '@components/Dropdown/types';
import { Theme } from '@types';

export const themes: Record<Theme, ItemType> = {
  [Theme.GENERAL]: {
    id: Theme.GENERAL,
    domId: 'theme-general',
    label: 'General Science',
  },
  [Theme.ASTROPHYSICS]: {
    id: Theme.ASTROPHYSICS,
    domId: 'theme-astrophysics',
    label: 'Astrophysics',
  },
  [Theme.HELIOPHYISCS]: {
    id: Theme.HELIOPHYISCS,
    domId: 'theme-heliophysics',
    label: 'Heliophysics',
  },
  [Theme.PLANET_SCIENCE]: {
    id: Theme.PLANET_SCIENCE,
    domId: 'theme-planetary',
    label: 'Planetary Science',
  },
  [Theme.EARTH_SCIENCE]: {
    id: Theme.EARTH_SCIENCE,
    domId: 'theme-earth',
    label: 'Earth Science',
  },
  [Theme.BIO_PHYSICAL]: {
    id: Theme.BIO_PHYSICAL,
    domId: 'theme-biophysical',
    label: 'Biological & Physical Science',
  },
};
