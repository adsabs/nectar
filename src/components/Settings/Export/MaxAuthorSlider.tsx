import { NumberSlider } from './NumberSlider';

export interface IMaxAuthorSliderProps {
  value: number;
  onChange: (v: number) => void;
}

export const MIN_EXPORT_AUTHORS = 1;
export const MAX_EXPORT_AUTHORS = 500;

export const MaxAuthorSlider = ({ value, onChange }: IMaxAuthorSliderProps) => {
  return (
    <NumberSlider
      min={MIN_EXPORT_AUTHORS}
      max={MAX_EXPORT_AUTHORS}
      value={value}
      onChange={onChange}
      label="Maximum Authors"
    />
  );
};
