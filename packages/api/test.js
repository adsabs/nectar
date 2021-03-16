const api = require('./dist/index').default;

(async () => {
  try {
    const data = await api.user.register({
      email: 'twhostetler0+testx6@gmail.com',
      password1: 'test1',
      password2: 'test2',
      verify_url: '/',
    });

    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.log(e);
  }

  // console.log(data, { docs: data.response.docs });
})();
