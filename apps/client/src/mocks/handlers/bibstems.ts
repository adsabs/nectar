import { rest } from 'msw';
import defaultBibstems from '@/components/BibstemPicker/defaultBibstems.json';
import { IBibstemOption } from '@/types';

export const bibstemHandlers = [
  rest.get<unknown, { term: string }>(`*/api/bibstems/:term`, (req, res, ctx) => {
    const term = req.params.term.toLowerCase();
    const values = defaultBibstems.filter(({ value, label }) => {
      const parts = `${value} ${Array.isArray(label) ? label[0] : label}`.toLowerCase().match(/\S+\s*/g);
      if (parts === null) {
        return false;
      }
      return parts.some((v) => v.startsWith(term));
    });
    return res(ctx.status(200), ctx.json<IBibstemOption[]>(values));
  }),
];
