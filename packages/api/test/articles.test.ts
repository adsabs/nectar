import api from '../src';

describe('articles service', () => {
  it('basic', async () => {
    const response = await api.articles.query({ q: 'star' });

    console.log(response);
  });
});
