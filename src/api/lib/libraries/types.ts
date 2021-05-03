export interface ILibraryEntity {
  num_documents: number;
  date_last_modified: string;
  permission: string;
  description: string;
  public: boolean;
  num_users: number;
  owner: string;
  date_created: string;
  id: string;
  name: string;
}

export interface ILibraryApiResponse {
  libraries: ILibraryEntity[];
}

export interface ILibraryApiErrorResponse {
  error: string;
}

export interface ILibraryApiEntityResponse {
  documents: unknown[];
  updates: {
    update_list: unknown[];
    num_updated: 0;
    duplicates_removed: 0;
  };
  metadata: ILibraryEntity;
}
