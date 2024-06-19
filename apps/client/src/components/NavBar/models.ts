import { SelectOption } from '@/components/Select';
import { AppMode } from '@/types';

export const modes: Record<AppMode, SelectOption<AppMode>> = {
  [AppMode.GENERAL]: {
    id: AppMode.GENERAL,
    value: 'general',
    label: 'General Science',
  },
  [AppMode.ASTROPHYSICS]: {
    id: AppMode.ASTROPHYSICS,
    value: 'astrophysics',
    label: 'Astrophysics',
  },
  [AppMode.HELIOPHYSICS]: {
    id: AppMode.HELIOPHYSICS,
    value: 'heliophysics',
    label: 'Heliophysics',
  },
  [AppMode.PLANET_SCIENCE]: {
    id: AppMode.PLANET_SCIENCE,
    value: 'planetary',
    label: 'Planetary Science',
  },
  [AppMode.EARTH_SCIENCE]: {
    id: AppMode.EARTH_SCIENCE,
    value: 'earth',
    label: 'Earth Science',
  },
  [AppMode.BIO_PHYSICAL]: {
    id: AppMode.BIO_PHYSICAL,
    value: 'biophysical',
    label: 'Biological & Physical Science',
  },
};
