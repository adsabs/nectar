import Adsapi from '@api';
import qs from 'qs';
import { PaperFormParams, PaperFormType, RawPaperFormParams } from './types';

export class PaperFormController {
  public params: PaperFormParams;
  public query: string;

  constructor(public type: PaperFormType, public rawParams: RawPaperFormParams, private adsapi: Adsapi) {
    this.params = this.sanitizeRawParams();
  }

  public async getQuery(): Promise<string> {
    switch (this.type) {
      case PaperFormType.JOURNAL_QUERY: {
        const { bibstem, year, volume, page } = this.params;
        const q = [];

        bibstem.length > 0 && q.push(`bibstem:${bibstem}`);
        year.length > 0 && q.push(`year:${year}`);
        volume.length > 0 && q.push(`volume:${volume}`);
        page.length > 0 && q.push(`page:${page}`);

        return qs.stringify({ q: q.join(' '), sort: 'date desc' }, { indices: false });
      }
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
        const q = `bibcode:${bibcode}`;
        return qs.stringify({ q, sort: 'date desc' }, { indices: false });
      }
      case PaperFormType.BIBCODE_QUERY: {
        const { bibcodes } = this.params;

        const result = await this.adsapi.vault.query({ bigquery: `bibcode\n${bibcodes.join('\n')}` });
        let q: string;
        result.match(
          ({ qid }) => (q = `docs(${qid})`),
          (e) => {
            throw e;
          },
        );

        return qs.stringify({ q, sort: 'date desc' }, { indices: false });
      }
    }
  }

  private sanitizeRawParams(): PaperFormParams {
    const { bibcodes = '', bibstem = '', reference = '', page = '', volume = '', year = '' } = this.rawParams;

    console.log('sanitize', this.rawParams);

    const clean: PaperFormParams = {
      bibstem,
      page,
      bibcodes: bibcodes.split(/[\s\n\r\t]+/),
      reference,
      volume,
      year,
    };

    console.log('clean', clean);

    return clean;
  }
}
