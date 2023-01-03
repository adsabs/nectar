export const exportTypes = [
  '| Lastname, Firstname | Affiliation | Last Active Date | [csv]',
  '| Lastname | Firstname | Affiliation | Last Active Date | [csv]',
  '| Lastname, Firstname | Affiliation | Last Active Date | [excel]',
  '| Lastname | Firstname | Affiliation | Last Active Date | [excel]',
  'Lastname, Firstname(Affiliation)Last Active Date[text]',
  'Lastname, Firstname(Affiliation)Last Active Date[browser]',
] as const;

export const exportTypeFileMappings = ['CSV', 'CSV', 'XLS', 'XLS', 'TEXT', 'BROWSER'] as const;

export const countOptions = [1, 2, 3, 4, 5, 10];
export const NONESYMBOL = '-' as const;
export const EXPORT_DELIMETER = '|' as const;
