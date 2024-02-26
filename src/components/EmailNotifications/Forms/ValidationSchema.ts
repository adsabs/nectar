import { NotificationFrequency, NotificationTemplate, NotificationType } from '@api';
import { z } from 'zod';

export const ValidationSchema = z
  .object({
    active: z.boolean(),
    data: z.string(),
    frequency: z.custom<NotificationFrequency>(),
    name: z.string(),
    template: z.custom<NotificationTemplate>(),
    type: z.custom<NotificationType>(),
    qid: z.string(),
    stateful: z.boolean(),
    classes: z.string().array(),
  })
  .superRefine((schema, context) => {
    if ((schema.type === 'query' && !schema.name) || schema.name.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['name'],
        message: 'Name is required',
      });
    }
    return z.NEVER;
  });
