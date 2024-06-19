export const Favicons = () => {
  return (
    <>
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/light/favicon-32x32.png"
        media="(prefers-color-scheme: dark)"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/light/favicon-16x16.png"
        media="(prefers-color-scheme: dark)"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/light/apple-touch-icon.png"
        media="(prefers-color-scheme: dark)"
      />
      <link rel="manifest" href="/light/site.webmanifest" media="(prefers-color-scheme: dark)" />

      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/dark/favicon-32x32.png"
        media="(prefers-color-scheme: light)"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/dark/favicon-16x16.png"
        media="(prefers-color-scheme: light)"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/dark/apple-touch-icon.png"
        media="(prefers-color-scheme: light)"
      />
      <link rel="manifest" href="/dark/site.webmanifest" media="(prefers-color-scheme: light)" />

      <meta name="theme-color" content="#ffffff" />
    </>
  );
};
