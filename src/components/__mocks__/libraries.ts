import { LibraryMeta } from '@components';

export const libraries: LibraryMeta[] = [
  {
    id: '1',
    visibility: 'public',
    collaborators: 0,
    name: 'My Shared Public Library',
    description: 'my first library',
    papers: 200,
    owner: 'JC',
    permission: 'owner',
    lastModified: '',
  },
  {
    id: '2',
    visibility: 'private',
    collaborators: 2,
    name: 'My Public Library',
    description: 'some public library',
    papers: 500,
    owner: 'JC',
    permission: 'owner',
    lastModified: '',
  },
  {
    id: '3',
    visibility: 'private',
    collaborators: 1,
    name: 'My Shared Private Library',
    description: 'some private library',
    papers: 100,
    owner: 'JC',
    permission: 'owner',
    lastModified: '',
  },
  {
    id: '4',
    visibility: 'private',
    collaborators: 0,
    name: "ABC's Library",
    description: 'a library',
    papers: 200,
    owner: 'ABC',
    permission: 'admin',
    lastModified: '',
  },
  {
    id: '1',
    visibility: 'private',
    collaborators: 5,
    name: "ABC's Library",
    description: 'another library',
    papers: 300,
    owner: 'ABC',
    permission: 'read',
    lastModified: '',
  },
];