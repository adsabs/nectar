import React, { DetailedHTMLProps, InputHTMLAttributes } from 'react';

interface ITextboxProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  label: React.ReactNode;
}

const Textbox: React.FC<ITextboxProps> = (props) => {
  const { label, ...inputProps } = props;

  return (
    <>
      <label className="block font-bold" htmlFor={`${label}-textbox`}>
        {label}
      </label>
      <input
        className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded"
        id={`${label}-textbox`}
        name={`${label}-textbox`}
        type="text"
        {...inputProps}
      />
    </>
  );
};

export default Textbox;
