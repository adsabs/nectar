import { IExportFormat, MostUsedExportFormats } from '@/api/export/types';
import { CustomFormat } from '@/api/user/types';
import { AppMode } from '@/types';

export const DISCIPLINE_CITATION_DEFAULTS = {
  [AppMode.ASTROPHYSICS]: 'bibtex',
  [AppMode.HELIOPHYSICS]: 'agu',
  [AppMode.PLANET_SCIENCE]: 'icarus',
  [AppMode.EARTH_SCIENCE]: 'agu',
  [AppMode.GENERAL]: 'agu',
  [AppMode.BIO_PHYSICAL]: 'apsj',
} satisfies Record<AppMode, string>;

export interface ResolvedCitationFormat {
  id: string;
  name: string;
  asHtml: boolean;
  isInModal: boolean;
  customFormat?: string;
  customFormatId?: string;
}

export interface ResolveCitationFormatInput {
  isAuthenticated: boolean;
  defaultExportFormatLabel: string;
  customFormats: CustomFormat[];
  appMode: AppMode;
  formats: IExportFormat[];
}

const disciplineDefaultsById = DISCIPLINE_CITATION_DEFAULTS as Record<string, string>;

export const disciplineCitationFormatId = (mode?: string): string => disciplineDefaultsById[mode ?? ''] ?? 'agu';

export interface ResolveRouteFormatInput {
  requested?: string | string[];
  availableIds: string[];
  fallbackId: string;
}

export const resolveRouteFormat = ({ requested, availableIds, fallbackId }: ResolveRouteFormatInput): string =>
  typeof requested === 'string' && availableIds.includes(requested) ? requested : fallbackId;

const findByName = (formats: IExportFormat[], name: string): IExportFormat | undefined =>
  formats.find((format) => format.name === name);

const findById = (formats: IExportFormat[], id: string): IExportFormat | undefined =>
  formats.find((format) => format.route.substring(1) === id);

const isInModal = (id: string): boolean => (MostUsedExportFormats as readonly string[]).includes(id);

const fromManifest = (format: IExportFormat): ResolvedCitationFormat => {
  const id = format.route.substring(1);

  return {
    id,
    name: format.name,
    asHtml: format.type === 'HTML',
    isInModal: isInModal(id),
  };
};

const disciplineDefault = (appMode: AppMode, formats: IExportFormat[]): ResolvedCitationFormat => {
  const id = DISCIPLINE_CITATION_DEFAULTS[appMode];
  const option = findById(formats, id);

  if (option) {
    return fromManifest(option);
  }

  const aguOption = findById(formats, 'agu');

  if (aguOption) {
    return fromManifest(aguOption);
  }

  return { id, name: id, asHtml: false, isInModal: false };
};

export const resolveCitationFormat = (input: ResolveCitationFormatInput): ResolvedCitationFormat => {
  const { isAuthenticated, defaultExportFormatLabel, customFormats, appMode, formats } = input;

  if (!isAuthenticated) {
    return disciplineDefault(appMode, formats);
  }

  const option = findByName(formats, defaultExportFormatLabel);

  if (!option) {
    return disciplineDefault(appMode, formats);
  }

  if (option.route !== '/custom') {
    return fromManifest(option);
  }

  const saved = customFormats?.[0];

  if (!saved) {
    return disciplineDefault(appMode, formats);
  }

  return {
    id: 'custom',
    name: saved.name,
    asHtml: false,
    isInModal: false,
    customFormat: saved.code,
    customFormatId: saved.id,
  };
};
