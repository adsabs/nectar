import { NumberSlider } from './NumberSlider';

export interface IMaxAuthorCutoffSliderProps {
  value: number;
  onChange: (v: number) => void;
}

export const MIN_EXPORT_AUTHORS_CUTOFF = 1;
export const MAX_EXPORT_AUTHORS_CUTOFF = 500;

export const MaxAuthorCutoffSlider = ({ value, onChange }: IMaxAuthorCutoffSliderProps) => {
  return (
    <NumberSlider
      min={MIN_EXPORT_AUTHORS_CUTOFF}
      max={MAX_EXPORT_AUTHORS_CUTOFF}
      value={value}
      onChange={onChange}
      label="Maximum Authors Cutoff"
    />
  );
};
