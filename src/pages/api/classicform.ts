import { classicformController } from '@controllers/classicformController';
import { validateMiddleware } from '@middleware/validateMiddleware';
import { initMiddleware } from '@utils';
import { check, validationResult } from 'express-validator';
import type { NextApiRequest, NextApiResponse } from 'next';
import { head } from 'ramda';

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const logicAndOrReg = /^(and|or)$/i;
  const logicAllReg = /^(and|or|boolean)$/i;
  const dateSanitizer = (value: string) => {
    if (value.length === 0) {
      return undefined;
    }
    try {
      const parts = value.split('/');
      const year = Math.min(Math.max(parseInt(parts[0]), 0), 9999);
      const month = Math.min(Math.max(parseInt(parts[1]), 1), 12);
      if (year === 9999) {
        return undefined;
      }
      return [year, month];
    } catch (e) {
      return undefined;
    }
  };
  const listSanitizer = (v: string) => (v.length > 0 ? Array.from(v.matchAll(/[^\r\n]+/g), head) : undefined);
  const delimSanitizer = (v: string) => (v.length > 0 ? v.split(/[^\w]+/) : undefined);

  const validateBody = initMiddleware(
    validateMiddleware(
      [
        // limit checkboxes
        check('limit_astronomy').toBoolean(),
        check('limit_general').toBoolean(),
        check('limit_physics').toBoolean(),

        // property checkboxes
        check('property_refereed_only').toBoolean().default(false),
        check('property_physics').toBoolean().default(false),

        // logic radios
        check('logic_author').default('and').matches(logicAndOrReg),
        check('logic_object').default('and').matches(logicAndOrReg),
        check('logic_title').default('and').matches(logicAllReg),
        check('logic_abstract_keywords').default('and').matches(logicAllReg),

        // sort control
        check('sort').default('date desc'),

        // custom user input
        check('author').default('').escape().customSanitizer(listSanitizer),
        check('object').default('').escape().customSanitizer(listSanitizer),
        check('pubdate_start').default('').customSanitizer(dateSanitizer),
        check('pubdate_end').default('').customSanitizer(dateSanitizer),
        check('title').default('').escape().customSanitizer(delimSanitizer),
        check('abstract_keywords').default('').escape().customSanitizer(delimSanitizer),
        check('bibstems').default('').escape().customSanitizer(delimSanitizer),
      ],
      validationResult,
    ),
  );

  await validateBody(req, res);

  const errors = validationResult(req);
  classicformController(req, res, errors);
};
