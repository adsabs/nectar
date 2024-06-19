exports.component = (name) => `import { FC, HTMLAttributes, ReactChild } from 'react';
import PT from 'prop-types';

export interface I${name}Props extends HTMLAttributes<HTMLDivElement> {
  children?: ReactChild
}

const propTypes = {
  children: PT.element,
}

export const ${name}: FC<I${name}Props> = (props) => {
  const { children, ...divProps } = props;
  return (
    <div {...divProps}>
      <p>👋 from ${name} component</p>
      <p>{ children }</p>
    </div>
  );
};

${name}.propTypes = propTypes;
`;

exports.story = (name) => `import { Meta, StoryObj } from '@storybook/react';
import { ${name} } from '../${name}';

const meta: Meta = {
  title: '${name}',
  component: ${name},
};

type Story = StoryObj<typeof ${name}>;

export default meta;

export const Default: Story = {};
`;

exports.test = (name) => `import { render } from '@/test-utils';
import { test } from 'vitest';
import { composeStories } from '@storybook/testing-react';
import * as stories from '../__stories__/${name}.stories';

const { Default: ${name} } = composeStories(stories);

test('renders without crashing', () => {
  render(${'<' + name} />);
});
`;

exports.barrel = (name) => `export * from './${name}';
`;
