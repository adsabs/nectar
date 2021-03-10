import api from '../src';

describe('search service', () => {
  it('basic', async () => {
    const response = await api.search.query({ q: 'star' });
  });
});
