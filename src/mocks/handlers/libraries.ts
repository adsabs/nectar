import { rest } from 'msw';
import allLibraries from '../responses/library/all-libraries.json';
import allEntities from '../responses/library/library-entities.json';
import allPermissions from '../responses/library/permissions.json';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { uniq } from 'ramda';
import {
  IADSApiLibraryAddAnnotationParams,
  IADSApiLibraryAddParams,
  IADSApiLibraryDeleteAnnotationParams,
  IADSApiLibraryDocumentParams,
  IADSApiLibraryEditMetaParams,
  IADSApiLibraryEntityResponse,
  IADSApiLibraryOperationParams,
  IADSApiLibraryPermissionResponse,
  IADSApiLibraryPermissionUpdateParams,
  IADSApiLibraryResponse,
  IADSApiLibraryTransferParams,
  IADSApiLibraryUpdateAnnotationParams,
  ILibraryMetadata,
} from '@/api/biblib/types';
import { ApiTargets } from '@/api/models';

const libraries = [...allLibraries] as ILibraryMetadata[];

const permissions = allPermissions as { [key in string]: IADSApiLibraryPermissionResponse };

const entities = allEntities as { [key in string]: IADSApiLibraryEntityResponse };

// get library
export const librariesHandlers = [
  rest.get(apiHandlerRoute(ApiTargets.LIBRARIES, '/:id'), (req, res, ctx) => {
    const id = req.params.id as string;
    return res(ctx.json(entities[id]));
  }),

  // get libraries
  rest.get(apiHandlerRoute(ApiTargets.LIBRARIES), (req, res, ctx) => {
    const start = req.url.searchParams.has('start') ? Number(req.url.searchParams.get('start')) : 0;
    const rows = req.url.searchParams.has('rows') ? Number(req.url.searchParams.get('rows')) : libraries.length;
    const sortby = req.url.searchParams.has('sort')
      ? (req.url.searchParams.get('sort') as keyof ILibraryMetadata)
      : 'date_last_modified';
    const order = req.url.searchParams.has('order') ? req.url.searchParams.get('order') : 'desc';
    const access_type = req.url.searchParams.has('access_type') ? req.url.searchParams.get('access_type') : 'all';

    libraries.sort((l1, l2) => (l1[sortby] > l2[sortby] ? 1 : l1[sortby] < l2[sortby] ? -1 : 0));
    if (order === 'desc') {
      libraries.reverse();
    }

    let ret = [...libraries];
    if (access_type == 'owner') {
      ret = libraries.filter((l) => l.permission === 'owner');
    } else if (access_type === 'collaborator') {
      ret = libraries.filter((l) => l.permission !== 'owner');
    }

    const r = {
      libraries: ret.slice(start, start + rows),
      count: ret.length,
    } as IADSApiLibraryResponse;
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

  // edit library meta
  rest.put<Omit<IADSApiLibraryEditMetaParams, 'id'>, { id: string }>(
    apiHandlerRoute(ApiTargets.DOCUMENTS, '/:id'),
    async (req, res, ctx) => {
      const id = req.params.id;
      const { name, description, public: isPublic } = req.body;

      const library = libraries.find((l) => l.id === id);
      const entity = entities[id];

      if (name) {
        library.name = name;
        entity.metadata.name = name;
      }

      if (description) {
        library.description = description;
        entity.metadata.description = description;
      }

      if (isPublic) {
        library.public = isPublic;
        entity.metadata.public = isPublic;
      }

      return res(ctx.json({ name: library.name, description: library.description, public: library.public }));
    },
  ),

  //  delete/add documents
  rest.post<null | IADSApiLibraryDocumentParams, { id: string }>(
    apiHandlerRoute(ApiTargets.DOCUMENTS, '/:id'),
    async (req, res, ctx) => {
      const id = req.params.id;

      if (req.body.action === 'remove') {
        // remove docs
        entities[id].documents = entities[id].documents.filter((bibcode) => req.body.bibcode.indexOf(bibcode) === -1);
        const removed = entities[id].solr.response.numFound - entities[id].documents.length;
        entities[id].solr.response.docs = entities[id].solr.response.docs.filter(
          ({ bibcode }) => req.body.bibcode.indexOf(bibcode) === -1,
        );
        entities[id].solr.response.numFound = entities[id].solr.response.docs.length;
        entities[id].metadata.num_documents = entities[id].solr.response.docs.length;
        libraries.find((l) => l.id === id).num_documents = entities[id].solr.response.docs.length;
        return res(ctx.json({ removed }));
      } else {
        // add docs
        entities[id].documents = uniq([...entities[id].documents, ...req.body.bibcode]);
        const added = entities[id].documents.length - entities[id].solr.response.numFound;
        entities[id].solr.response.docs = entities[id].documents.map((bibcode) => ({ bibcode: bibcode }));
        entities[id].solr.response.numFound = entities[id].solr.response.docs.length;
        entities[id].metadata.num_documents = entities[id].solr.response.docs.length;
        libraries.find((l) => l.id === id).num_documents = entities[id].solr.response.numFound;
        return res(ctx.json({ added }));
      }
    },
  ),

  rest.get<null, { id: string }>(apiHandlerRoute(ApiTargets.PERMISSIONS, '/:id'), async (req, res, ctx) => {
    const id = req.params.id;
    return res(ctx.json(permissions[id]));
  }),

  rest.post<IADSApiLibraryPermissionUpdateParams, { id: string }>(
    apiHandlerRoute(ApiTargets.PERMISSIONS, '/:id'),
    async (req, res, ctx) => {
      const id = req.params.id;
      const { email, permission } = req.body;

      const userPermissions = permissions[id].find((up) => !!up[email]);

      if (userPermissions) {
        // existing user
        if (!permission.admin && !permission.read && !permission.write) {
          // remove user
          permissions[id] = permissions[id].filter((up) => !up[email]);
        } else {
          userPermissions[email] = permission.admin
            ? ['admin']
            : permission.write
            ? ['write']
            : permission.read
            ? ['read']
            : [];
        }
      } else {
        // new user
        permissions[id].push({
          [email]: permission.admin ? ['admin'] : permission.write ? ['write'] : permission.read ? ['read'] : [],
        });
      }

      return res(ctx.json({}));
    },
  ),

  rest.post<Omit<IADSApiLibraryTransferParams, 'id'>, { id: string }>(
    apiHandlerRoute(ApiTargets.LIBRARY_TRANSFER, '/:id'),
    async (req, res, ctx) => {
      const id = req.params.id;
      const { email } = req.body;

      libraries.find((l) => l.id === id).owner = email;
      entities[id].metadata.owner = email;

      return res(ctx.json({}));
    },
  ),

  // add note
  rest.post<Omit<IADSApiLibraryAddAnnotationParams, 'library' | 'bibcode'>, { library: string; bibcode: string }>(
    apiHandlerRoute(ApiTargets.LIBRARY_NOTES, '/:library/:bibcode'),
    async (req, res, ctx) => {
      const { library, bibcode } = req.params;
      const { content } = req.body;

      entities[library].library_notes.notes[bibcode] = {
        id: '12345',
        content,
        bibcode,
        library_id: library,
        date_created: '2019-04-15T19:03:15.345389',
        date_last_modified: '2019-04-15T19:03:15.345389',
      };

      return res(ctx.json(await req.json()));
    },
  ),

  // update note
  rest.put<Omit<IADSApiLibraryUpdateAnnotationParams, 'library' | 'bibcode'>, { library: string; bibcode: string }>(
    apiHandlerRoute(ApiTargets.LIBRARY_NOTES, '/:library/:bibcode'),
    async (req, res, ctx) => {
      const { library, bibcode } = req.params;
      const { content } = req.body;

      entities[library].library_notes.notes[bibcode].content = content;

      return res(ctx.json(await req.json()));
    },
  ),

  // delete note
  rest.delete<Omit<IADSApiLibraryDeleteAnnotationParams, 'library' | 'bibcode'>, { library: string; bibcode: string }>(
    apiHandlerRoute(ApiTargets.LIBRARY_NOTES, '/:library/:bibcode'),
    async (req, res, ctx) => {
      const { library, bibcode } = req.params;

      delete entities[library].library_notes.notes[bibcode];

      return res(ctx.json(await req.json()));
    },
  ),
];
