import React from 'react';

const withRecoilRoot = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => ({ ...props }) => (
  <RecoilRoot>
    <Component {...(props as P)} />
  </RecoilRoot>
);

export default withRecoilRoot;
