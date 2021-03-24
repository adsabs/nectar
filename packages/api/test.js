const api = require('./dist/index').default;

(async () => {
  try {
    const { response, data } = await api.accounts.bootstrap();

    console.log(JSON.stringify({ response, data }, null, 2));
  } catch (e) {
    console.log(e);
  }

  // console.log(data, { docs: data.response.docs });
})();
