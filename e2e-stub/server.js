const express = require('express');

const app = express();
const PORT = 18080;

const calls = [];

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`[STUB] E2E stub backend listening on http://127.0.0.1:${PORT}`);
  console.log('[STUB] Endpoints:');
  console.log('  - GET  /accounts/bootstrap');
  console.log('  - GET  /accounts/verify/:token');
  console.log('  - ALL  /link_gateway/*');
  console.log('  - GET  /__test__/calls');
  console.log('  - POST /__test__/reset');
});
