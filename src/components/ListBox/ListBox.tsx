import { faSortAlphaUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

export interface IListBoxProps {
  // children?: ReactChild,
  label: string;
}

export const ListBox = (props: IListBoxProps): React.ReactElement => {
  const { label } = props;

  const title = (
    <label
      id="listbox-label"
      className="block text-sm font-medium text-gray-700"
    >
      {label}
    </label>
  );

  return (
    <div>
      {title}
      <div className="mt-1 relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded="true"
          aria-labelledby="listbox-label"
          className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-8 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <span className="flex items-center divide-x-2">
            <div className="pr-2">
              <FontAwesomeIcon icon={faSortAlphaUp} />
            </div>
            <div className="pl-2 py-2 whitespace-nowrap">Author Count</div>
          </span>
          <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {/* Heroicon name: solid/selector */}
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>
        {/*
Select popover, show/hide based on select state.

Entering: ""
  From: ""
  To: ""
Leaving: "transition ease-in duration-100"
  From: "opacity-100"
  To: "opacity-0"
    */}
        <div className="absolute mt-1 w-full rounded-md bg-white shadow-lg">
          <ul
            tabIndex={-1}
            role="listbox"
            aria-labelledby="listbox-label"
            aria-activedescendant="listbox-item-3"
            className="max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
          >
            {/*
    Select option, manage highlight styles based on mouseenter/mouseleave and keyboard navigation.

    Highlighted: "text-white bg-indigo-600", Not Highlighted: "text-gray-900"
  */}
            <li
              id="listbox-item-0"
              role="option"
              className="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9"
            >
              <div className="flex items-center">
                <img
                  src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt=""
                  className="flex-shrink-0 h-6 w-6 rounded-full"
                />
                {/* Selected: "font-semibold", Not Selected: "font-normal" */}
                <span className="ml-3 block font-normal truncate">
                  Wade Cooper
                </span>
              </div>
              {/*
      Checkmark, only display for selected option.

      Highlighted: "text-white", Not Highlighted: "text-indigo-600"
    */}
              <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                {/* Heroicon name: solid/check */}
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </li>
            {/* More items... */}
          </ul>
        </div>
      </div>
    </div>
  );
};
