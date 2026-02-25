// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require('express');

const app = express();
const PORT = 18080;

const calls = [];

app.use(express.json());

// CORS headers for cross-origin client-side API calls.
// Must reflect the request origin (not '*') because axios sends withCredentials: true.
app.use((req, res, next) => {
  const origin = req.headers.origin || 'http://nectar:8000';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Test-Scenario, X-Forwarded-For');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/accounts/bootstrap', (req, res) => {
  const scenario = req.headers['x-test-scenario'];

  calls.push({
    endpoint: '/accounts/bootstrap',
    scenario,
    headers: {
      cookie: req.headers.cookie,
      'x-test-scenario': scenario,
    },
    timestamp: Date.now(),
  });

  console.log(`[STUB] Bootstrap called with scenario: ${scenario || 'default'}`);

  if (scenario === 'bootstrap-failure') {
    return res.status(500).send('Server Error');
  }

  if (scenario === 'bootstrap-network-error') {
    req.socket.destroy();
    return;
  }

  if (scenario === 'bootstrap-authenticated') {
    return res
      .status(200)
      .set('Set-Cookie', 'ads_session=authenticated-session; Domain=example.com; SameSite=None; Secure')
      .json({
        username: 'test@example.com',
        scopes: ['api', 'execute-query', 'store-query', 'user'],
        client_id: 'test-client-id',
        access_token: 'mocked-authenticated-token',
        client_name: 'Test Client',
        token_type: 'Bearer',
        ratelimit: 1.0,
        anonymous: false,
        client_secret: 'test-secret',
        expires_at: '999999999999999999',
        refresh_token: 'test-refresh-token',
        given_name: 'Test',
        family_name: 'User',
      });
  }

  if (scenario === 'bootstrap-anonymous') {
    return res
      .status(200)
      .set('Set-Cookie', 'ads_session=anonymous-session; Domain=example.com; SameSite=None; Secure')
      .json({
        username: 'anonymous@ads',
        scopes: ['api', 'execute-query', 'store-query'],
        client_id: 'test-client-id',
        access_token: 'mocked-anonymous-token',
        client_name: 'Test Client',
        token_type: 'Bearer',
        ratelimit: 1.0,
        anonymous: true,
        client_secret: 'test-secret',
        expires_at: '999999999999999999',
        refresh_token: 'test-refresh-token',
        given_name: 'Anonymous',
        family_name: 'User',
      });
  }

  if (scenario === 'bootstrap-rotated-cookie') {
    const currentCookie = req.headers.cookie || '';
    const newCookie = currentCookie ? `${currentCookie}-rotated` : 'rotated-session';
    return res
      .status(200)
      .set('Set-Cookie', `ads_session=${newCookie}; Domain=example.com; SameSite=None; Secure`)
      .json({
        username: 'anonymous@ads',
        scopes: ['api', 'execute-query', 'store-query'],
        client_id: 'test-client-id',
        access_token: 'mocked-anonymous-token',
        client_name: 'Test Client',
        token_type: 'Bearer',
        ratelimit: 1.0,
        anonymous: true,
        client_secret: 'test-secret',
        expires_at: '999999999999999999',
        refresh_token: 'test-refresh-token',
        given_name: 'Test',
        family_name: 'Tester',
      });
  }

  if (scenario === 'bootstrap-unchanged-cookie') {
    return res
      .status(200)
      .set('Set-Cookie', 'ads_session=unchanged-session; Domain=example.com; SameSite=None; Secure')
      .json({
        username: 'anonymous@ads',
        scopes: ['api', 'execute-query', 'store-query'],
        client_id: 'test-client-id',
        access_token: 'mocked-anonymous-token',
        client_name: 'Test Client',
        token_type: 'Bearer',
        ratelimit: 1.0,
        anonymous: true,
        client_secret: 'test-secret',
        expires_at: '999999999999999999',
        refresh_token: 'test-refresh-token',
        given_name: 'Test',
        family_name: 'Tester',
      });
  }

  return res
    .status(200)
    .set('Set-Cookie', 'ads_session=default-session; Domain=example.com; SameSite=None; Secure')
    .json({
      username: 'anonymous@ads',
      scopes: ['api', 'execute-query', 'store-query'],
      client_id: 'test-client-id',
      access_token: 'mocked-anonymous-token',
      client_name: 'Test Client',
      token_type: 'Bearer',
      ratelimit: 1.0,
      anonymous: true,
      client_secret: 'test-secret',
      expires_at: '999999999999999999',
      refresh_token: 'test-refresh-token',
      given_name: 'Test',
      family_name: 'Tester',
    });
});

app.post('/accounts/user/login', (req, res) => {
  const scenario = req.headers['x-test-scenario'];

  calls.push({
    endpoint: '/accounts/user/login',
    scenario,
    body: req.body,
    timestamp: Date.now(),
  });

  console.log(`[STUB] Login called with scenario: ${scenario || 'default'}`);

  if (scenario === 'login-success') {
    return res
      .status(200)
      .set('Set-Cookie', 'ads_session=authenticated-session; Domain=example.com; SameSite=None; Secure')
      .json({ message: 'success' });
  }

  if (scenario === 'login-failure') {
    return res.status(401).json({ error: 'invalid-credentials' });
  }

  // default: success
  return res
    .status(200)
    .set('Set-Cookie', 'ads_session=authenticated-session; Domain=example.com; SameSite=None; Secure')
    .json({ message: 'success' });
});

app.get('/accounts/verify/:token', (req, res) => {
  const { token } = req.params;
  const scenario = req.headers['x-test-scenario'];

  calls.push({
    endpoint: `/accounts/verify/${token}`,
    scenario,
    timestamp: Date.now(),
  });

  console.log(`[STUB] Verify called with token: ${token}, scenario: ${scenario || 'default'}`);

  if (scenario === 'verify-success') {
    return res
      .status(200)
      .set('Set-Cookie', `ads_session=verified-${token}; Domain=example.com; SameSite=None; Secure`)
      .json({ message: 'success', email: 'verified@example.com' });
  }

  if (scenario === 'verify-unknown-token') {
    return res.status(200).json({ error: 'unknown verification token' });
  }

  if (scenario === 'verify-already-validated') {
    return res.status(200).json({ error: 'already been validated' });
  }

  if (scenario === 'verify-failure') {
    return res.status(500).send('Server Error');
  }

  if (scenario === 'verify-network-error') {
    req.socket.destroy();
    return;
  }

  return res
    .status(200)
    .set('Set-Cookie', `ads_session=verified-${token}; Domain=example.com; SameSite=None; Secure`)
    .json({ message: 'success', email: 'verified@example.com' });
});

app.get('/__test__/calls', (req, res) => {
  res.json({ calls, count: calls.length });
});

app.post('/__test__/reset', (req, res) => {
  calls.length = 0;
  console.log('[STUB] State reset');
  res.json({ ok: true });
});

app.use('/link_gateway', (req, res) => {
  calls.push({
    endpoint: `/link_gateway${req.path}`,
    timestamp: Date.now(),
  });

  console.log(`[STUB] Link gateway called: /link_gateway${req.path}`);
  res.status(200).json({ status: 'ok' });
});

// --- Search API ---
app.get('/search/query', (req, res) => {
  const scenario = req.headers['x-test-scenario'];

  calls.push({
    endpoint: '/search/query',
    scenario,
    query: req.query,
    timestamp: Date.now(),
  });

  console.log(`[STUB] Search called with q=${req.query.q}, scenario: ${scenario || 'default'}`);

  // Return minimal search results
  res.status(200).json({
    responseHeader: {
      status: 0,
      QTime: 1,
      params: { q: req.query.q || '*:*', rows: req.query.rows || '10', start: '0' },
    },
    response: {
      numFound: 1,
      start: 0,
      docs: [
        {
          bibcode: '2024ApJ...test..001A',
          title: ['Test Paper: A Study of Testing in Astrophysics'],
          author: ['Author, Test A.', 'Writer, Example B.'],
          aff: ['Test University', 'Example Institute'],
          pubdate: '2024-01-00',
          pub: 'The Astrophysical Journal',
          citation_count: 5,
          read_count: 42,
          '[citations]': { num_citations: 5, num_references: 10 },
          property: ['REFEREED', 'ARTICLE'],
          abstract: 'This is a test abstract for smoke testing purposes.',
          doi: ['10.1234/test.2024.001'],
          keyword: ['testing', 'smoke tests', 'astrophysics'],
          doctype: 'article',
          identifier: ['2024ApJ...test..001A'],
          id: '1',
        },
      ],
    },
  });
});

// --- Stored search / vault ---
app.get('/vault/query/:qid', (req, res) => {
  calls.push({ endpoint: `/vault/query/${req.params.qid}`, timestamp: Date.now() });
  res.status(200).json({ qid: req.params.qid, query: 'bibcode:2024ApJ...test..001A', numfound: 1 });
});

app.post('/vault/query', (req, res) => {
  calls.push({ endpoint: '/vault/query', timestamp: Date.now() });
  res.status(200).json({ qid: 'test-qid-001' });
});

// --- User settings ---
app.get('/vault/user-data', (req, res) => {
  calls.push({ endpoint: '/vault/user-data', timestamp: Date.now() });
  res.status(200).json({});
});

// --- Notifications ---
app.get('/vault/notifications', (req, res) => {
  calls.push({ endpoint: '/vault/notifications', timestamp: Date.now() });
  res.status(200).json([]);
});

app.use('/vault/notification_query', (req, res) => {
  calls.push({ endpoint: req.baseUrl + req.path, timestamp: Date.now() });
  res.status(200).json([]);
});

// --- Libraries ---
app.get('/biblib/libraries', (req, res) => {
  calls.push({ endpoint: '/biblib/libraries', timestamp: Date.now() });
  res.status(200).json({ libraries: [] });
});

app.get('/biblib/libraries/:id', (req, res) => {
  calls.push({ endpoint: `/biblib/libraries/${req.params.id}`, timestamp: Date.now() });
  res.status(200).json({ metadata: { name: 'Test Library', id: req.params.id, num_documents: 0 }, documents: [] });
});

// --- ORCID ---
app.use('/orcid', (req, res) => {
  calls.push({ endpoint: req.baseUrl + req.path, timestamp: Date.now() });
  res.status(200).json({});
});

// --- Resolver/objects ---
app.use('/resolver', (req, res) => {
  calls.push({ endpoint: req.baseUrl + req.path, timestamp: Date.now() });
  res.status(200).json({ links: { records: [] } });
});

app.get('/objects/query', (req, res) => {
  calls.push({ endpoint: '/objects/query', timestamp: Date.now() });
  res.status(200).json({});
});

// --- Graphics ---
app.get('/graphics/:bibcode', (req, res) => {
  calls.push({ endpoint: `/graphics/${req.params.bibcode}`, timestamp: Date.now() });
  res.status(200).json({});
});

// --- Metrics ---
app.get('/metrics', (req, res) => {
  calls.push({ endpoint: '/metrics', timestamp: Date.now() });
  res.status(200).json({});
});

app.post('/metrics', (req, res) => {
  calls.push({ endpoint: '/metrics', timestamp: Date.now() });
  res.status(200).json({});
});

// --- Export ---
app.post('/export/:format', (req, res) => {
  calls.push({ endpoint: `/export/${req.params.format}`, timestamp: Date.now() });
  res.status(200).json({ msg: 'Retrieved 0 abstracts, took 0 seconds.', export: '' });
});

// --- Reference resolver ---
app.post('/reference/text', (req, res) => {
  calls.push({ endpoint: '/reference/text', timestamp: Date.now() });
  res.status(200).json({ resolved: { bibcode: [] } });
});

// --- Citation helper ---
app.post('/citation_helper', (req, res) => {
  calls.push({ endpoint: '/citation_helper', timestamp: Date.now() });
  res.status(200).json({ new: [], recommendations: [] });
});

// --- Author network / paper network / concept cloud ---
app.use('/vis', (req, res) => {
  calls.push({ endpoint: req.baseUrl + req.path, timestamp: Date.now() });
  res.status(200).json({ data: {} });
});

// --- Catch-all: return 404 for unknown endpoints so missing stubs are visible ---
app.use((req, res) => {
  calls.push({
    endpoint: req.path,
    method: req.method,
    timestamp: Date.now(),
    note: 'catch-all-404',
  });
  console.warn(`[STUB] WARNING: Unhandled ${req.method} ${req.path}`);
  res.status(404).json({ error: 'not-stubbed', path: req.path });
});

app.listen(PORT, () => {
  console.log(`[STUB] E2E stub backend listening on http://127.0.0.1:${PORT}`);
  console.log('[STUB] Endpoints:');
  console.log('  - GET  /accounts/bootstrap');
  console.log('  - POST /accounts/user/login');
  console.log('  - GET  /accounts/verify/:token');
  console.log('  - ALL  /link_gateway/*');
  console.log('  - GET  /search/query');
  console.log('  - GET  /vault/query/:qid');
  console.log('  - POST /vault/query');
  console.log('  - GET  /vault/user-data');
  console.log('  - GET  /vault/notifications');
  console.log('  - GET  /biblib/libraries');
  console.log('  - GET  /resolver/:bibcode/*');
  console.log('  - GET  /graphics/:bibcode');
  console.log('  - GET  /metrics');
  console.log('  - POST /export/:format');
  console.log('  - ALL  (catch-all -> 404)');
  console.log('  - GET  /__test__/calls');
  console.log('  - POST /__test__/reset');
});
