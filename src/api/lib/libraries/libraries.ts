import { AxiosError, AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { ApiTargets } from '../../../_api/models';
import { Service } from '../service';
import { ILibraryApiEntityResponse, ILibraryApiResponse, ILibraryEntity } from './types';

export class LibrariesService extends Service {
  // private normalizeParams(
  //   params: IADSApiSearchParams,
  // ): INormalizedADSApiSearchParams {
  //   if (!validate(params)) {
  //     throw new Error(
  //       validate.errors
  //         ?.map((e) => `${e.dataPath} ${e.message ?? ''}`)
  //         .join('\n'),
  //     );
  //   }

  //   return {
  //     ...params,
  //     sort: params.sort?.map(([type, dir]) => `${type} ${dir}`).join(' '),
  //     fl: params.fl?.join(','),
  //   };
  // }

  public async getLibrary({
    id,
  }: {
    id: ILibraryEntity['id'];
  }): Promise<Result<ILibraryApiEntityResponse, Error | AxiosError>> {
    const config: AxiosRequestConfig = {
      method: 'get',
      url: `${ApiTargets.LIBRARIES}/${id}`,
    };

    return await new Promise((resolve) => {
      this.request<ILibraryApiEntityResponse>(config).then(
        (result) => {
          result.match(
            ({ documents, updates, metadata }) => resolve(ok({ documents, updates, metadata })),
            (e: Error | AxiosError) => resolve(err(e)),
          );
        },
        (e: Error | AxiosError) => resolve(err(e)),
      );
    });
  }

  public async getLibraries(): Promise<Result<ILibraryApiResponse, Error | AxiosError>> {
    const config: AxiosRequestConfig = {
      method: 'get',
      url: ApiTargets.LIBRARIES,
    };

    return await new Promise((resolve) => {
      this.request<ILibraryApiResponse>(config).then(
        (result) => {
          result.match(
            (data) => resolve(ok(data)),
            (e: Error | AxiosError) => resolve(err(e)),
          );
        },
        (e: Error | AxiosError) => resolve(err(e)),
      );
    });
  }
}
