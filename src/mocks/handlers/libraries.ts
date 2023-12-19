import {
  ApiTargets,
  IADSApiLibraryAddParams,
  IADSApiLibraryAddResponse,
  IADSApiLibraryEntityResponse,
  IADSApiLibraryOperationParams,
  IADSApiLibraryOperationResponse,
  IADSApiLibraryResponse,
  ILibraryMetadata,
} from '@api';
import { rest } from 'msw';
import allLibraries from '../responses/library/all-libraries.json';
import allEntities from '../responses/library/library-entities.json';
import { apiHandlerRoute } from '@mocks/mockHelpers';
import { uniq } from 'ramda';

const libraries = [...allLibraries] as ILibraryMetadata[];

const entities = allEntities as { [key in string]: IADSApiLibraryEntityResponse };

export const librariesHandlers = [
  // get libraries
  rest.get(apiHandlerRoute(ApiTargets.LIBRARIES), (req, res, ctx) => {
    const start = req.url.searchParams.has('start') ? Number(req.url.searchParams.get('start')) : 0;
    const rows = req.url.searchParams.has('rows') ? Number(req.url.searchParams.get('rows')) : libraries.length;
    const r = { libraries: libraries.slice(start, start + rows) } as IADSApiLibraryResponse;
    return res(ctx.json(r));
  }),

  // library operation
  rest.post<IADSApiLibraryOperationParams, { id: string }>(
    apiHandlerRoute(ApiTargets.LIBRARY_OPERATION, '/:id'),
    (req, res, ctx) => {
      const id = req.params.id;
      const { description, libraries: ids, action, name, public: isPublic } = req.body;

      if (action === 'empty') {
        const l = libraries.find((lib) => lib.id === id);
        l.num_documents = 0;
        return res(ctx.json({}));
      } else if (action === 'copy') {
        const l1 = entities[id];
        const l2 = entities[ids[0]];
        const size = uniq([...l1.documents, ...l2.documents]).length;
        libraries.find((lib) => lib.id === ids[0]).num_documents = size;
        return res(ctx.json({}));
      } else {
        libraries.push({
          name,
          id: '022',
          description,
          num_documents: 0,
          date_created: '2023-12-14T19:37:48.139272',
          date_last_modified: '2023-12-14T19:37:48.139279',
          permission: 'owner',
          public: isPublic,
          num_users: 1,
          owner: 'ads.user.1',
        });

        return res(
          ctx.json({
            name,
            id: '022',
            description,
          }),
        );
      }
    },
  ),

  // add library
  rest.post<IADSApiLibraryAddParams>(apiHandlerRoute(ApiTargets.LIBRARIES), async (req, res, ctx) => {
    const { name, description, public: isPublic, bibcode } = req.body;

    libraries.push({
      name,
      id: '021',
      description,
      num_documents: bibcode ? bibcode.length : 0,
      date_created: '2023-12-14T19:37:48.139272',
      date_last_modified: '2023-12-14T19:37:48.139279',
      permission: 'owner',
      public: isPublic,
      num_users: 1,
      owner: 'ads.user.1',
    });

    return res(ctx.json(await req.json()));
  }),

  // delete library
  rest.delete<null, { id: string }>(apiHandlerRoute(ApiTargets.DOCUMENTS, '/:id'), async (req, res, ctx) => {
    const id = req.params.id;
    const index = libraries.findIndex((lib) => lib.id === id);

    libraries.splice(index, 1);

    return res(ctx.json({}));
  }),
];
