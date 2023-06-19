export interface IValue {
  errors?: unknown[];
  value: string;
  required?: boolean;
  getRequiredMessage?: unknown;
}
