import { DetailedHTMLProps, TextareaHTMLAttributes } from 'react';

interface ITextareaProps
  extends DetailedHTMLProps<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > {
  label: React.ReactNode;
}

const Textarea: React.FC<ITextareaProps> = (props) => {
  const { label, ...inputProps } = props;

  return (
    <label htmlFor={`${label}-textarea`} className="font-bold">
      {label}
      <textarea
        className="autoexpand tracking-wide py-2 px-4 mb-3 leading-relaxed appearance-none block w-full bg-gray-200 border border-gray-200 rounded focus:outline-none focus:bg-white focus:border-gray-500"
        id={`${label}-textarea`}
        placeholder="(Last, First M) one per line"
        defaultValue={''}
        {...inputProps}
      />
    </label>
  );
};

export default Textarea;
