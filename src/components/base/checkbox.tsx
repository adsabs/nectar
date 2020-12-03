import React, { DetailedHTMLProps, InputHTMLAttributes } from 'react';

const Checkbox: React.FC<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
> = (props) => {
  const { children, ...inputProps } = props;

  return (
    <label className="inline-flex items-center mt-3 mx-1">
      <input
        type="checkbox"
        className="form-checkbox h-5 w-5 text-blue-600"
        {...inputProps}
      />
      <span className="ml-2 text-gray-700">{children}</span>
    </label>
  );
};

export default Checkbox;
