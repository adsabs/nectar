const { resolve, parse } = require('path');
const { readdirSync } = require('fs');

/**
 * Run through all the files at /src, strip extensions,
 * and create alias entries for each
 */
const getPathAliases = () => {
  const src = resolve(__dirname, '../src');
  const files = readdirSync(src);
  return files.reduce((acc, file) => {
    const { name } = parse(file);
    return {
      ...acc,
      [`@${name}`]: resolve(__dirname, `../src/${name}`),
    };
  }, {});
};

/**
 * @type {import('@storybook/react/types').StorybookConfig}
 */
const config = {
  stories: [
    '../src/components/__stories__/**/*.stories.mdx',
    '../src/components/__stories__/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    {
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: require('postcss'),
        },
      },
    },
    'storybook-addon-next-router',
    '@chakra-ui/storybook-addon',
  ],
  typescript: {
    check: false,
  },
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      public: resolve(__dirname, '../public'),
      ...getPathAliases(),
    };
    return config;
  },
  core: {
    builder: 'webpack5',
  },
};

module.exports = config;
