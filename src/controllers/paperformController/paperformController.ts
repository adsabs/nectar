import Adsapi from '@api';
import { checks, stringifiers, stringify } from './helpers';
import { PaperFormParams, PaperFormType, RawPaperFormParams } from './types';

export class PaperFormController {
  public params: PaperFormParams;
  public query: string;

  constructor(public type: PaperFormType, public rawParams: RawPaperFormParams, private adsapi: Adsapi) {
    this.params = this.sanitizeRawParams();
  }

  public async getQuery(): Promise<string> {
    switch (this.type) {
      case PaperFormType.JOURNAL_QUERY:
        return stringifiers.journalForm(this.params);
      case PaperFormType.REFERENCE_QUERY: {
        const { reference } = this.params;
        const result = await this.adsapi.reference.query({ reference });

        const bibcode: string = result.match(
          ({ resolved: r }) => {
            if (r.score !== '0.0' && typeof r.bibcode === 'string') {
              return r.bibcode;
            }
            throw new Error(r.comment || 'No bibcodes matching reference string found');
          },
          (e) => {
            throw e;
          },
        );
        return stringify({ q: `bibcode:${bibcode}` });
      }
      case PaperFormType.BIBCODE_QUERY: {
        const { bibcodes } = this.params;

        const result = await this.adsapi.vault.query({ bigquery: `bibcode\n${bibcodes.join('\n')}` });
        const qid = result.match(
          ({ qid }) => qid,
          (e) => {
            throw e;
          },
        );

        return stringify({ q: `docs(${qid})` });
      }
    }
  }

  private sanitizeRawParams(): PaperFormParams {
    const { bibcodes = '', bibstem = '', reference = '', page = '', volume = '', year = '' } = this.rawParams;

    const clean: PaperFormParams = {
      bibcodes: checks.listCheck(bibcodes),
      bibstem: checks.escape(bibstem),
      page: checks.escape(page),
      reference: checks.escape(reference),
      volume: checks.escape(volume),
      year: checks.escape(year),
    };

    return clean;
  }
}
