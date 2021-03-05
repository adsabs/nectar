exports.component = (
  name,
) => `import React, { FC, HTMLAttributes, ReactChild } from 'react';

export interface I${name}Props extends HTMLAttributes<HTMLDivElement> {
  children?: ReactChild
}

export const ${name}: FC<I${name}Props> = ({ children }) => {
  return (
    <div>
      <p>👋 from ${name} component</p>
      <p>{ children }</p>
    </div>
  );
}
`;

exports.story = (name) => `import React from 'react';
import { Meta, Story } from '@storybook/react';
import { ${name}, I${name}Props } from '../src/${name}';

const meta: Meta = {
  title: '${name}',
  component: ${name},
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<I${name}Props> = args => ${'<' + name} {...args} />;

export const Default = Template.bind({});

Default.args = {};
`;

exports.test = (name) => `import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as ${name} } from '../stories/${name}.stories';

describe('${name}', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(${'<' + name} />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
`;

exports.barrel = (name) => `export * from './${name}';
`;
