import Image from 'next/image';
import React, { ReactElement } from 'react';
import { DropdownBasic } from '../Dropdown';

export const OrcidDropdown = (): ReactElement => {
  const handleOrcidSignIn = () => {
    console.log('orcid sign in ');
  };

  return (
    <DropdownBasic
      label={
        <>
          <div className="flex space-x-1">
            <Image
              src="/img/orcid_inactive.svg"
              width="18"
              height="18"
              alt="ORCID logo inactive"
              className="inline flex-shrink-0"
            />
            <span>ORCiD</span>
          </div>
        </>
      }
      classes={{
        button:
          'text-gray-300 hover:text-white focus:text-white flex items-center space-x-1',
        container: 'border p-3',
      }}
      offset={[-60, 12]}
    >
      <button
        onClick={handleOrcidSignIn}
        type="button"
        className="bg-blue-600 text-white border rounded-md p-2 hover:shadow-md"
      >
        Sign into ORCID to claim papers in ADS
      </button>
    </DropdownBasic>
  );
};
