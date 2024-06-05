import { MathJax3Config, MathJaxContext } from 'better-react-mathjax';
import { createElement, FC, PropsWithChildren, ReactElement } from 'react';

const config: MathJax3Config = {
  startup: {
    elements: null,
    typeset: false,
  },
  loader: { load: ['[tex]/html'] },
  tex: {
    packages: { '[+]': ['html'] },
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]'],
    ],
    processEscapes: true,
  },
};

export const MathJaxProvider: FC<PropsWithChildren> = ({ children }): ReactElement => {
  return createElement(MathJaxContext, { version: 3, config }, children);
};
