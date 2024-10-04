import z from 'zod';

/**
 * Checks if the provided email string is valid.
 *
 * Uses the Zod library to validate the email format.
 *
 * @param {string} email - The email address to be validated.
 * @return {boolean} - Returns true if the email is valid, otherwise false.
 */
export const isValidEmail = (email: string) => {
  const emailSchema = z.string().email();
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};
