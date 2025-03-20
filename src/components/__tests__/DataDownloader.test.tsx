import { render } from '@/test-utils';
import { afterEach, describe, test, vi } from 'vitest';
import { DataDownloader } from '@/components/DataDownloader';

const defaultURI = 'blob:http://localhost:8000/9303db9e-5b75-4d87-9aa8-804d7e59c29b';

vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => defaultURI),
});

vi.stubGlobal('open', vi.fn());

afterEach(() => {
  vi.clearAllMocks();
});

const csv = `First, Last, Street, City, State, Zip
John,Doe,120 jefferson st.,Riverside, NJ, 08075
Jack,McGinnis,220 hobo Av.,Phila, PA,09119
"John ""Da Man""",Repici,120 Jefferson St.,Riverside, NJ,08075
Stephen,Tyler,"7452 Terrace ""At the Plaza"" road",SomeTown,SD, 91234
,Blankman,,SomeTown, SD, 00298
"Joan ""the bone"", Anne",Jet,"9th, at Terrace plc",Desert City,CO,00123
`;

describe('DataDownloader', () => {
  test('renders without crashing', () => {
    render(<DataDownloader label={'download'} getFileContent={() => csv} fileName={'file.csv'} />);
  });
});
