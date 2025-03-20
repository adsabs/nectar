declare module 'react-copy-html-to-clipboard' {
  export interface CopyToClipboardProps {
    text: string;
    onCopy: () => void;
    options?: { asHtml: boolean };
    children: JSX.Element;
  }

  export default function CopyToClipboard(props: CopyToClipboardProps): JSX.Element;
}
