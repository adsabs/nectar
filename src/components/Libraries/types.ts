import { Permission } from '@api';

export type LibraryMeta = {
  id: string;
  visibility: 'public' | 'private';
  collaborators: number;
  name: string;
  papers: number;
  owner: string;
  permission: Permission;
  lastModified: string;
  description: string;
};

export type LibraryType = 'owner' | 'collab' | 'follow';
