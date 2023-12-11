import { MathJax3Config, MathJaxContext } from 'better-react-mathjax';
import { createElement, ReactNode } from 'react';

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

export const MathJaxProvider = ({ children }: { children: ReactNode }) => {
  return createElement(MathJaxContext, { version: 3, config }, children);
};
