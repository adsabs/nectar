const normalizePort: (val: any) => string | number | false = (val) => {
  const port = parseInt(val, 10);
  return isNaN(port) ? val : port >= 0 ? port : false;
};

export default normalizePort;
