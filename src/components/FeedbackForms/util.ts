import e from 'express';

export const isValidEamil = (email: string) => {
  return email && email.length > 0 && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email);
};
