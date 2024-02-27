import { useMediaQuery } from '@chakra-ui/react';

export const Favicons = () => {
  const [systemDarkMode] = useMediaQuery('(prefers-color-scheme: dark)');

  if (systemDarkMode) {
    // light colored icon (for dark mode)
    return (
      <>
        <link rel="icon" type="image/png" sizes="32x32" href="/dark/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/dark/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/dark/apple-touch-icon.png" />
        <link rel="manifest" href="/dark/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
      </>
    );
  }

  // dark colored icon (for light mode)
  return (
    <>
      <link rel="icon" type="image/png" sizes="32x32" href="/light/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/light/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/light/apple-touch-icon.png" />
      <link rel="manifest" href="/light/site.webmanifest" />
      <meta name="theme-color" content="#ffffff" />
    </>
  );
};
