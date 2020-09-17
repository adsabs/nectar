import React from 'react';

const NoScript: React.FC<INoScriptProps> = ({
  fallbackComponent = null,
  component,
}) => {
  // check if we are in the browser
  if (process.browser) {
    return <>{component}</>;
  }
  return <>{fallbackComponent}</>;
};

export interface INoScriptProps {
  fallbackComponent?: React.ReactNode;
  component: React.ReactNode;
}

export default NoScript;
