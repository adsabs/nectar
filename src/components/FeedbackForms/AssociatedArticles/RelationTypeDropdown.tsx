import { Select, SelectOption } from '@components';

export const RelationTypeDropdown = () => {
  const relationOptions: SelectOption<string>[] = [
    { id: 'errata', value: 'errata', label: 'Main paper/Errata' },
    { id: 'addenda', value: 'addenda', label: 'Main paper/Addenda' },
    { id: 'series', value: 'series', label: 'Series of Articles' },
    { id: 'arxiv', value: 'arxiv', label: 'arXiv/Published' },
    { id: 'other', value: 'other', label: 'Other' },
  ];

  return (
    <Select
      options={relationOptions}
      name="relation-type"
      label="Relation Type"
      id="relation-options"
      stylesTheme="default"
    />
  );
};
