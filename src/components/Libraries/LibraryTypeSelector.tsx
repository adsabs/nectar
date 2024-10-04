import { LibraryType } from '@/api';
import { Select, SelectOption } from '@/components/Select';

const libraryTypes: SelectOption<LibraryType>[] = [
  { id: 'all', label: 'All', value: 'all' },
  {
    id: 'owner',
    label: 'Owner',
    value: 'owner',
  },
  {
    id: 'collaborator',
    label: 'Collaborator',
    value: 'collaborator',
  },
  // TODO: {
  //   id: 'following',
  //   label: 'Following',
  //   value: 'following',
  // },
];

export const LibraryTypeSelector = ({
  type,
  onChange,
}: {
  type: LibraryType;
  onChange: (type: LibraryType) => void;
}) => {
  const option = libraryTypes.find((t) => t.id === type);
  const handleOnChange = (value: SelectOption<LibraryType>) => {
    onChange(value.id);
  };

  return (
    <Select<SelectOption<LibraryType>>
      name="library-type"
      label="Library Type"
      hideLabel={true}
      id="lib-type-select"
      options={libraryTypes}
      value={option}
      onChange={handleOnChange}
      stylesTheme="default"
    />
  );
};
