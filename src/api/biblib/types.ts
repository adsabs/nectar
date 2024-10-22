/* eslint-disable @typescript-eslint/no-empty-interface */
import { BiblibSort, SolrSort } from '@/api/models';
import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';

export const permissions = ['owner', 'admin', 'write', 'read'];

export type LibraryPermission = typeof permissions[number];

export type LibraryIdentifier = string;

export type UserPermission = {
  [user in string]: LibraryPermission[];
};

export type LibraryOperationAction = 'union' | 'intersection' | 'difference' | 'copy' | 'empty';

export interface ILibraryMetadata {
  num_documents: number;
  date_last_modified: string;
  permission: LibraryPermission;
  description: string;
  public: boolean;
  num_users: number;
  owner: string;
  date_created: string;
  id: LibraryIdentifier;
  name: string;
}

export type LibraryType = 'all' | 'owner' | 'collaborator'; // TODO: 'following';

// Get all libraries
export interface IADSApiLibraryParams {
  start?: number;
  rows?: number;
  sort?: keyof ILibraryMetadata;
  order?: 'asc' | 'desc';
  access_type?: LibraryType;
}

export interface IADSApiLibraryResponse {
  count: number;
  libraries?: ILibraryMetadata[];
}

// Get library Entity
export interface IADSApiLibraryEntityParams {
  id: LibraryIdentifier;
  start?: number;
  rows?: number;
  sort?: (SolrSort | BiblibSort)[];
}
export interface IADSApiLibraryEntityResponse {
  documents: IDocsEntity['bibcode'][];
  updates: {
    update_list: unknown[];
    num_updated: 0;
    duplicates_removed: 0;
  };
  metadata: ILibraryMetadata;
  solr: {
    response: {
      numFound: number;
      start: number;
      docs: { bibcode: string; alternate_bibcode?: string[] }[];
    };
  };
  library_notes?: {
    notes?: { [key in string]: INote };
    orphan_notes?: { [key in string]: INote };
  };
}

// Add library

export interface IADSApiLibraryAddParams {
  name: string;
  description: string;
  public: boolean;
  bibcode?: string[];
}

export interface IADSApiLibraryAddResponse {
  name: string;
  id: LibraryIdentifier;
  description: string;
}

// Delete library

export interface IADSApiLibraryDeleteParams {
  id: LibraryIdentifier;
}

export interface IADSApiLibraryDeleteResponse {}

// Modify library metadata
export interface IADSApiLibraryEditMetaParams {
  id: LibraryIdentifier;
  name?: string;
  description?: string;
  public?: boolean;
}

export interface IADSApiLibraryEditMetaResponse {
  name?: string;
  description?: string;
  public?: boolean;
}

// Library operation

/**
 * @param {LibraryIdentifier[]} libraries - List of secondary libraries to include in the action (optional, based on action)
 * @param {LibraryOperationAction} action
 * @param {string} name - name of the new library (must be unique for that user); used only for actions in [union, intersection, difference]
 * @param {string} description - description of the new library; used only for actions in [union, intersection, difference]
 * @param {boolean} public -  is the new library public to view; used only for actions in [union, intersection, difference]
 */
export interface IADSApiLibraryOperationParams {
  id: LibraryIdentifier;
  libraries?: LibraryIdentifier[];
  action: LibraryOperationAction;
  name?: string;
  description?: string;
  public?: boolean;
}

export interface IADSApiLibraryOperationResponse {
  name: string;
  id: LibraryIdentifier;
  description: string;
}

// Add, remove document to/from library using bibcodes

export interface IADSApiLibraryDocumentParams {
  id: LibraryIdentifier;
  bibcode: string[];
  action: 'add' | 'remove';
}

export interface IADSApiLibraryDocumentResponse {
  number_added: number;
  number_removed: number;
}

// Add documents to library using search query

export interface IADSApiLibraryQueryParams {
  id: LibraryIdentifier;
  params: IADSApiSearchParams;
  action: 'add' | 'remove';
}
export interface IADSApiLibraryQueryResponse {
  number_added: number;
  valid_bibcode: string[];
}

// Add/remove documents to library using search query

export interface IADSApiLibraryQueryUpdateParams {
  id: LibraryIdentifier;
  query: IADSApiSearchParams;
  action: 'add' | 'remove';
}

export interface IADSApiLibraryQueryUpdateResponse {
  number_added: number;
  number_removed: number;
  valid_bibcode: string[];
}

// permission

export interface IADSApiLibraryPermissionParams {
  id: LibraryIdentifier;
}

export interface IADSApiLibraryPermissionResponse extends Array<UserPermission> {}

export interface IADSApiLibraryPermissionUpdateParams {
  id: LibraryIdentifier;
  email: string;
  permission: { [key in 'read' | 'write' | 'admin']?: boolean };
}

export interface IADSApiLibraryPermissionUpdateResponse {}

// Transfer

export interface IADSApiLibraryTransferParams {
  id: LibraryIdentifier;
  email: string;
}

export interface IADSApiLibraryTransferResponse {}

export interface IADSApiLibraryErrorResponse {
  error: string;
}

export interface IADSApiLibraryGetAnnotationParams {
  library: LibraryIdentifier;
  bibcode: string;
}

export interface INote {
  id: string;
  content: string;
  bibcode: string;
  library_id: LibraryIdentifier;
  date_created: string;
  date_last_modified: string;
}

export interface IADSApiLibraryGetAnnotationResponse {
  document: string;
  note: INote;
  library_metadata: ILibraryMetadata;
}

export interface IADSApiLibraryAddAnnotationParams {
  library: LibraryIdentifier;
  bibcode: string;
  content: string;
}

export interface IADSApiLibraryAddAnnotationResponse {
  document: string;
  note: INote;
  library_metadata: ILibraryMetadata;
}

export interface IADSApiLibraryUpdateAnnotationParams {
  library: LibraryIdentifier;
  bibcode: string;
  content: string;
}

export interface IADSApiLibraryUpdateAnnotationResponse {
  document: string;
  note: INote;
  library_metadata: ILibraryMetadata;
}

export interface IADSApiLibraryDeleteAnnotationParams {
  library: LibraryIdentifier;
  bibcode: string;
}

export interface IADSApiLibraryDeleteAnnotationResponse {}
