export type Reference = { citing: string; cited: string };

export type FormValues = {
  name: string;
  email: string;
  references: Reference[];
};
