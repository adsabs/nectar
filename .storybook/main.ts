const config = {
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  stories: ['../src/components/**/__stories__/*.stories.@(ts|tsx)'],
  addons: ['@chakra-ui/storybook-addon', '@storybook/addon-essentials'],
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  features: {
    emotionAlias: false,
  },
  core: {
    disableTelemetry: true,
  },
};

export default config;
