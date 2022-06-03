import { SolrSort } from '@api';
import { isNil } from 'ramda';
import { checks, stringifiers } from './helpers';
import { ClassicFormParams, RawClassicFormParams } from './types';

export class ClassicformController {
  public params: ClassicFormParams;
  public query: string;
  constructor(public rawParams: RawClassicFormParams) {
    this.params = this.sanitizeRawParams();
  }
  getQuery(): string {
    const query = [
      stringifiers.collections(this.params),
      stringifiers.authors(this.params),
      stringifiers.bibstems(this.params),
      stringifiers.abstracts(this.params),
      stringifiers.objects(this.params),
      stringifiers.title(this.params),
      stringifiers.pubdate(this.params),
      stringifiers.property(this.params),
    ]
      .filter((v) => !isNil(v))
      .join(' ');

    this.query = `q=${query}&sort=${this.params.sort}`;
    return this.query;
  }
  sanitizeRawParams(): ClassicFormParams {
    const {
      limit_astronomy,
      limit_general,
      limit_physics,
      property_refereed_only,
      property_articles_only,
      logic_author = 'and',
      logic_object = 'and',
      logic_title = 'and',
      logic_abstract_keywords = 'and',
      sort = 'date desc',
      author = '',
      object = '',
      title = '',
      abstract_keywords = '',
      bibstems = '',
      pubdate_start = '',
      pubdate_end = '',
    } = this.rawParams;

    const clean: ClassicFormParams = {
      limit_astronomy: checks.binaryCheck(limit_astronomy),
      limit_general: checks.binaryCheck(limit_general),
      limit_physics: checks.binaryCheck(limit_physics),
      property_articles_only: checks.binaryCheck(property_articles_only),
      property_refereed_only: checks.binaryCheck(property_refereed_only),
      logic_author: checks.logicAndOrCheck(logic_author),
      logic_object: checks.logicAndOrCheck(logic_object),
      logic_title: checks.logicAllCheck(logic_title),
      logic_abstract_keywords: checks.logicAllCheck(logic_abstract_keywords),
      sort: sort as SolrSort,
      author: checks.listCheck(author),
      object: checks.listCheck(object),
      title: checks.delimCheck(title),
      abstract_keywords: checks.delimCheck(abstract_keywords),
      bibstems: checks.delimCheck(bibstems),
      pubdate_start: checks.dateCheck(pubdate_start),
      pubdate_end: checks.dateCheck(pubdate_end),
    };

    return clean;
  }
}
