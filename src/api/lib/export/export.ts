import { AxiosError, AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { IExportApiResponse } from '.';
import { ApiTargets } from '../models';
import { Service } from '../service';
import { IExportApiParams } from './types';

export class ExportService extends Service {
  async getExportText(params: IExportApiParams): Promise<Result<string, Error | AxiosError>> {
    const { format, customFormat, ...data } = params;
    const config: AxiosRequestConfig = {
      method: 'post',
      url: `${ApiTargets.EXPORT}/${format}`,
      data: { ...data, format: customFormat },
    };

    return await new Promise((resolve) => {
      this.request<IExportApiResponse>(config).then(
        (result) => {
          result.match(
            ({ export: exportString }) => resolve(ok(exportString)),
            (e: Error | AxiosError) => resolve(err(e)),
          );
        },
        (e: Error | AxiosError) => resolve(err(e)),
      );
    });
  }
}
