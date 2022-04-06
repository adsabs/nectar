import { SelectOption } from '@components/Select';
import { Theme } from '@types';

export const themes: Record<Theme, SelectOption<Theme>> = {
  [Theme.GENERAL]: {
    id: Theme.GENERAL,
    value: 'general',
    label: 'General Science',
  },
  [Theme.ASTROPHYSICS]: {
    id: Theme.ASTROPHYSICS,
    value: 'astrophysics',
    label: 'Astrophysics',
  },
  [Theme.HELIOPHYISCS]: {
    id: Theme.HELIOPHYISCS,
    value: 'heliophysics',
    label: 'Heliophysics',
  },
  [Theme.PLANET_SCIENCE]: {
    id: Theme.PLANET_SCIENCE,
    value: 'planetary',
    label: 'Planetary Science',
  },
  [Theme.EARTH_SCIENCE]: {
    id: Theme.EARTH_SCIENCE,
    value: 'earth',
    label: 'Earth Science',
  },
  [Theme.BIO_PHYSICAL]: {
    id: Theme.BIO_PHYSICAL,
    value: 'biophysical',
    label: 'Biological & Physical Science',
  },
};
