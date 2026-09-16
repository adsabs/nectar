// next/script only server-renders at strategy="beforeInteractive" in the
// pages router; any other strategy appends to document.body client-side
// after hydration, which GTM flags as "tag not placed correctly". Inline
// the snippet directly in _document's <Head> instead.
export const getGtmSnippet = (gtmId: string): string => `
  (function(w,d,s,l,i){
    w[l]=w[l]||[];
    w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
    var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
    j.async=true;
    j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer',${JSON.stringify(gtmId)});
`;
