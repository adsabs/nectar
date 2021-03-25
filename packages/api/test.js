const Adsapi = require('./dist/index').default;

(async () => {
  try {

    const { access_token } = await Adsapi.bootstrap();
    console.log({ access_token})

    const adsapi = new Adsapi({ token: access_token, debug: true })

    const response = await adsapi.search.query({ q: 'star' });

    console.log(JSON.stringify(response, null, 2));
  } catch (e) {
    console.log(e);
  }

  // console.log(data, { docs: data.response.docs });
})();
