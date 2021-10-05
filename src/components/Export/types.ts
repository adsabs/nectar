import { IDocsEntity } from '@api';
import { ExportApiFormat } from '@api/lib/export';

export interface ExportState {
  format: ExportApiFormat;
  limit: number;
  customFormat: string;
  bibcodes: IDocsEntity['bibcode'][];
  text: string;
  singleMode: boolean;
  loadInitially: boolean;
}
