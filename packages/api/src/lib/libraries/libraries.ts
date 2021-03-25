import { ApiTargets } from '../models';
import { Service } from '../service';
import {
  ILibraryApiEntityResponse,
  ILibraryApiErrorResponse,
  ILibraryApiResponse,
  ILibraryEntity,
} from './types';

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
  }): Promise<ILibraryApiEntityResponse> {
    try {
      const { documents, updates, metadata } = await this.request<
        ILibraryApiEntityResponse,
        ILibraryApiErrorResponse
      >({
        method: 'get',
        url: `${ApiTargets.LIBRARIES}/${id}`,
      });

      return { documents, updates, metadata };
    } catch (e) {
      throw new Error(e);
    }
  }

  public async getLibraries(): Promise<ILibraryApiResponse> {
    try {
      const data = await this.request<
        ILibraryApiResponse,
        ILibraryApiErrorResponse
      >({
        method: 'get',
        url: ApiTargets.LIBRARIES,
      });

      return data;
    } catch (e) {
      throw new Error(e);
    }
  }
}
