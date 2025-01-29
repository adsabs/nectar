export function convertHtmlToRtf(html: string) {
  let richText = html;

  // Delete HTML comments
  richText = richText.replace(/<!--[\s\S]*?-->/gi, '');

  // Singleton tags
  richText = richText.replace(
    /<(?:hr)(?:\s+[^>]*)?\s*[\/]?>/gi,
    '{\\pard \\brdrb \\brdrs \\brdrw10 \\brsp20 \\par}\n{\\pard\\par}\n',
  );
  richText = richText.replace(/<(?:br)(?:\s+[^>]*)?\s*[\/]?>/gi, '{\\pard\\par}\n');

  // Empty tags
  richText = richText.replace(/<(?:p|div|section|article)(?:\s+[^>]*)?\s*[\/]>/gi, '{\\pard\\par}\n');
  richText = richText.replace(/<(?:[^>]+)\/>/g, '');

  // Hyperlinks
  richText = richText.replace(
    /<a(?:\s+[^>]*)?(?:\s+href=(["'])(?:javascript:void\(0?\);?|#|return false;?|void\(0?\);?|)\1)(?:\s+[^>]*)?>/gi,
    '{{{\n',
  );
  const tmpRichText = richText;
  richText = richText.replace(
    /<a(?:\s+[^>]*)?(?:\s+href=(["'])(.+)\1)(?:\s+[^>]*)?>/gi,
    '{\\field{\\*\\fldinst{HYPERLINK\n "$2"\n}}{\\fldrslt{\\ul\\cf1\n',
  );
  const hasHyperlinks = richText !== tmpRichText;
  richText = richText.replace(/<a(?:\s+[^>]*)?>/gi, '{{{\n');
  richText = richText.replace(/<\/a(?:\s+[^>]*)?>/gi, '\n}}}');

  // Start tags
  richText = richText.replace(/<(?:b|strong)(?:\s+[^>]*)?>/gi, '{\\b\n');
  richText = richText.replace(/<(?:i|em)(?:\s+[^>]*)?>/gi, '{\\i\n');
  richText = richText.replace(/<(?:u|ins)(?:\s+[^>]*)?>/gi, '{\\ul\n');
  richText = richText.replace(/<(?:strike|del)(?:\s+[^>]*)?>/gi, '{\\strike\n');
  richText = richText.replace(/<sup(?:\s+[^>]*)?>/gi, '{\\super\n');
  richText = richText.replace(/<sub(?:\s+[^>]*)?>/gi, '{\\sub\n');
  richText = richText.replace(/<(?:p|div|section|article)(?:\s+[^>]*)?>/gi, '{\\pard\n');
  richText = richText.replace(/<(?:h1|h2|h3|h4|h5|h6)(?:\s+[^>]*)?>/gi, '{\\pard\\par}{\\pard\\b\n');
  richText = richText.replace(
    /<(?:ol)(?:\s+[^>]*)?>/gi,
    '{\\pard\\par}{{\\*\\pn\\pnlvlbody\\pnindent0\\pnstart1\\pndec{\\pntxta.}}\\fi-240\\li720\\sa200\\sl180\\slmult1',
  );
  richText = richText.replace(
    /<(?:ul)(?:\s+[^>]*)?>/gi,
    "{\\pard\\par}{{\\*\\pn\\pnlvlblt\\pnf1\\pnindent0{\\pntxtb\\'B7}}\\fi-240\\li720\\sa200\\sl180\\slmult1",
  );
  richText = richText.replace(/<(?:li)(?:\s+[^>]*)?>/gi, '{\\pntext\\tab}');

  // End tags
  richText = richText.replace(/<\/(?:p|div|section|article)(?:\s+[^>]*)?>/gi, '\n\\par}\n');
  richText = richText.replace(/<\/(?:h1|h2|h3|h4|h5|h6)(?:\s+[^>]*)?>/gi, '\n\\par}\n');
  richText = richText.replace(/<\/(?:b|strong|i|em|u|ins|strike|del|sup|sub|ol|ul)(?:\s+[^>]*)?>/gi, '\n}');
  richText = richText.replace(/<\/(?:li)(?:\s+[^>]*)?>/gi, '\\par');

  // Strip any other remaining HTML tags [but leave their contents]
  richText = richText.replace(/<(?:[^>]+)>/g, '');

  // Remove empty line at the beginning of the text
  richText = richText.startsWith('{\\pard\\par}') ? richText.substring(11) : richText;

  // Prefix and suffix the rich text with the necessary syntax
  richText =
    '{\\rtf1\\ansi\n' + (hasHyperlinks ? '{\\colortbl\n;\n\\red0\\green0\\blue255;\n}\n' : '') + richText + '\n}';

  return richText;
}
