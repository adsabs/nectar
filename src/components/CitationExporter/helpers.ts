const htmlEntities: [string, string][] = [
  ['&amp;', '&'],
  ['&lt;', '<'],
  ['&gt;', '>'],
  ['&quot;', '"'],
  ['&apos;', "'"],
  ['&nbsp;', ' '],
  ['&copy;', '©'],
  ['&reg;', '®'],
];

const htmlEntityMap = new Map<string, string>(htmlEntities);

export function htmlToRtfPreprocess(html: string) {
  let rtf = html.replace(/&[a-zA-Z]+;/g, function (entity) {
    return htmlEntityMap.get(entity) ?? entity;
  });

  // html-to-rtf fails to do text format tags properly, so we manually do it first
  rtf = rtf.replace(/<b>/g, '\\b ').replace(/<\/b>/g, '\\b0 ');
  rtf = rtf.replace(/<i>/g, '\\i ').replace(/<\/i>/g, '\\i0 ');
  rtf = rtf.replace(/<u>/g, '\\ul ').replace(/<\/u>/g, '\\ulnone ');
  rtf = rtf.replace(/<strike>/g, '\\strike ').replace(/<\/strike>/g, '\\strike0 ');
  rtf = rtf.replace(/<sub>/g, '\\sub ').replace(/<\/sub>/g, '\\sub0 ');
  rtf = rtf.replace(/<sup>/g, '\\super ').replace(/<\/sup>/g, '\\super0 ');
  rtf = rtf.replace(/<strong>/g, '\\b ').replace(/<\/strong>/g, '\\b0 ');
  rtf = rtf.replace(/<em>/g, '\\i ').replace(/<\/em>/g, '\\i0 ');
  rtf = rtf.replace(/<blockquote>/g, '\\quote ').replace(/<\/blockquote>/g, '\\quote0 ');
  rtf = rtf.replace(/<pre>/g, '\\pard\\sl0\\slmult1 ').replace(/<\/pre>/g, '\\par ');

  // new line
  rtf = rtf.replace(/\n/g, '<br>');

  return rtf;
}
