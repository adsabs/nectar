import request from 'supertest';
import app from '../src/app';

describe('Basic Server Operation', () => {
  it('should give back correct response', () => {
    request(app)
      .get('/api/test')
      .send({ test: 1 });
  });
});
