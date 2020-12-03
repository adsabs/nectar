import React, { DetailedHTMLProps, InputHTMLAttributes } from 'react';

const Radio: React.FC<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
> = (props) => {
  const { children, ...inputProps } = props;

  return (
    <label className="inline-flex items-center mx-1">
      <input
        type="radio"
        className="form-radio h-5 w-5 text-blue-600"
        {...inputProps}
      />
      <span className="ml-2 text-gray-700">{children}</span>
    </label>
  );
};

export default Radio;
