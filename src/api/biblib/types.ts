/* eslint-disable @typescript-eslint/no-empty-interface */
import { IADSApiSearchParams } from '@api/search';

export type Permission = 'owner' | 'admin' | 'read' | 'write';

export type UserPermission = {
  [user in string]: Permission[];
};

export interface ILibraryMetadata {
  num_documents: number;
  date_last_modified: string;
  permission: Permission;
  description: string;
  public: boolean;
  num_users: number;
  owner: string;
  date_created: string;
  id: string;
  name: string;
}

// Get all libraries
export interface IADSApiLibraryParams {
  start: number;
  rows: number;
  sort_col: 'date_created' | 'date_last_modified'; // no sort by name?
  sort_dir: 'asc' | 'desc';
}

export interface IADSApiLibraryResponse {
  libraries: ILibraryMetadata[];
}

// Get library Entity
export interface IADSApiLibraryEntityParams {
  id: string;
}
export interface IADSApiLibraryEntityResponse {
  documents: string[];
  updates: {
    update_list: unknown[];
    num_updated: 0;
    duplicates_removed: 0;
  };
  metadata: ILibraryMetadata;
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
  id: string;
  description: string;
}

// Delete library

export interface IADSApiLibraryDeleteParams {
  id: string;
}

export interface IADSApiLibraryDeleteResponse {}

// Modify library metadata
export interface IADSApiLibraryEditMetaParams {
  id: string;
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
export interface IADSApiLibraryOperationParams {
  id: string;
  libraries?: string[]; // List of secondary libraries to include in the action (optional, based on action)
  action: 'union' | 'intersection' | 'difference' | 'copy' | 'empty';
  name?: string; // name of the new library (must be unique for that user); used only for actions in [union, intersection, difference]
  description?: string; // description of the new library; used only for actions in [union, intersection, difference]
  public?: boolean; // is the new library public to view; used only for actions in [union, intersection, difference]
}

export interface IADSApiLibraryOperationResponse {
  name: string;
  id: string;
  description: string;
}

// Add, remove document to/from library using bibcodes

export interface IADSApiLibraryDocumentParams {
  id: string;
  bibcode: string[]; // List of bibcodes
  action: 'add' | 'remove';
}

export interface IADSApiLibraryDocumentResponse {
  number_added: number;
  number_removed: number;
}

// Add documents to library using search query

export interface IADSApiLibraryQueryParams extends IADSApiSearchParams {
  id: string;
}

export interface IADSApiLibraryQueryResponse {
  number_added: number; // number of documents added
  valid_bibcode: string[]; // the list of valid bibcodes
}

// Add/remove documents to library using search query

export interface IADSApiLibraryQueryUpdateParams {
  id: string;
  query: IADSApiSearchParams;
  action: 'add' | 'remove';
}

export interface IADSApiLibraryQueryUpdateResponse {
  number_added: number; // number of documents added (if 'add' is used)
  number_removed: number; // number of documents removed (if 'remove' is used)
  valid_bibcode: string[]; // the list of valid bibcodes
}

// permission

export interface IADSApiLibraryPermissionParams {
  id: string;
}

export interface IADSApiLibraryPermissionResponse extends Array<UserPermission> {}

export interface IADSApiLibraryPermissionUpdateParams {
  id: string;
  email: string; // which user
  permissions: Omit<Permission, 'owner'>; //specifies which permission to change
  value: boolean; // whether the user has this permission
}

export interface IADSApiLibraryPermissionUpdateResponse {}

// Transfer

export interface IADSApiLibraryTransferParams {
  id: string;
  transfer_user: string; //  e-mail of the user the account should be transfered to
}

export interface IADSApiLibraryTransferResponse {}

export interface IADSApiLibraryErrorResponse {
  error: string;
}
