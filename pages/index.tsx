import SearchBar from '@components/searchbar';
import {
  faCode,
  faLifeRing,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { queryState } from '@recoil/atoms';
import Link from 'next/link';
import React from 'react';
import { useRecoilState } from 'recoil';

const Home: React.FC = () => {
  const [{ q: searchQuery }, setQueryState] = useRecoilState(queryState);
  const handleExampleClick = (text: string) => {
    setQueryState({ q: `${searchQuery} ${text}` });
  };

  return (
    <>
      <h2 className="sr-only">Modern Search Form</h2>
      <form action="search" method="get">
        <div className="my-6">
          <SearchBar />
        </div>
        <div className="mt-4">
          <h3 className="text-lg text-center mb-3 font-bold">
            Search Examples
          </h3>
          <SearchExamples onClick={handleExampleClick} />
        </div>
      </form>
      <hr className="divide-x-0 my-4 w-3/4 mx-auto" />
      <div className="flex w-3/4 mx-auto justify-evenly flex-col md:flex-row">
        <Link href="#">
          <a className="text-blue-500 p-4 hover:bg-gray-200 flex flex-col items-center  justify-center ">
            <div className="text-4xl my-4">
              <FontAwesomeIcon icon={faLifeRing} />
            </div>
            <div className="font-bold">Use a classic ADS-style form</div>
          </a>
        </Link>
        <Link href="#">
          <a className="text-blue-500 p-4 hover:bg-gray-200 flex flex-col items-center justify-center ">
            <div className="text-4xl my-4">
              <FontAwesomeIcon icon={faSearch} />
            </div>
            <div className="font-bold">Learn more about searching the ADS</div>
          </a>
        </Link>
        <Link href="#">
          <a className="text-blue-500 p-4 hover:bg-gray-200 flex flex-col items-center  justify-center ">
            <div className="text-4xl my-4">
              <FontAwesomeIcon icon={faCode} />
            </div>
            <div className="font-bold">Access ADS data with our API</div>
          </a>
        </Link>
      </div>
    </>
  );
};

// const IsolatedSearchBar = () => {
//   const [value, setValue] = React.useState('');
//   const handleClear = () => {
//     setValue('');
//   };
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setValue(e.currentTarget.value);
//   };

//   const handleExampleClick = (text: string) => {
//     setValue(`${value} ${text}`);
//   };

//   return (
//     <>
//       <div className="my-6">
//         <SearchBar
//           value={value}
//           onChange={handleChange}
//           onClear={handleClear}
//         />
//       </div>
//       <div className="mt-4">
//         <h3 className="text-lg text-center mb-3 font-bold">Search Examples</h3>
//         <SearchExamples onClick={handleExampleClick} />
//       </div>
//     </>
//   );
// };

const SearchExamples = React.memo<{ onClick(text: string): void }>(
  ({ onClick }) => {
    const examplesLeft = [
      { label: 'author', text: 'author:"huchra, john"' },
      { label: 'first author', text: 'author:"^huchra, john"' },
      { label: 'abstract+title', text: 'abs:"dark energy"' },
      { label: 'year', text: 'year:2000' },
      { label: 'year range', text: 'year:2000-2005' },
      { label: 'full text', text: 'full:"gravity waves"' },
      { label: 'publication', text: 'bibstem:ApJ' },
    ];
    const examplesRight = [
      { label: 'citations', text: 'citations(author:"huchra, j")' },
      { label: 'references', text: 'references(author:"huchra, j")' },
      { label: 'reviews', text: 'reviews("gamma-ray bursts")' },
      { label: 'refereed', text: 'property:refereed' },
      { label: 'astronomy', text: 'database:astronomy' },
      { label: 'OR', text: 'abs:(planet OR star)' },
    ];

    const createHandler = (text: string) => {
      if (typeof onClick === 'function') {
        return onClick.bind(null, text);
      }
      return () => {};
    };

    return (
      <div className="flex w-3/4 mx-auto justify-evenly flex-col md:flex-row">
        <ul className="flex-col md:px-3 md:w-1/3">
          {examplesLeft.map(({ label, text }) => (
            <li className="flex justify-between py-1" key={label}>
              <div className="flex items-center flex-1">{label}</div>
              <button
                type="button"
                className="border border-dotted p-1 font-bold hover:bg-gray-200"
                onClick={createHandler(text)}
              >
                {text}
              </button>
            </li>
          ))}
        </ul>
        <ul className="flex-col md:px-3 md:w-5/12">
          {examplesRight.map(({ label, text }) => (
            <li className="flex justify-evenly py-1" key={label}>
              <div className="flex items-center flex-1">{label}</div>
              <button
                type="button"
                className="border border-dotted p-1 font-bold hover:bg-gray-200"
                onClick={createHandler(text)}
              >
                {text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);

export default Home;
