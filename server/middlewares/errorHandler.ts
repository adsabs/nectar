type ExceptionHandler = (err: Error) => void;
const onUncaughtException: ExceptionHandler = (err) => {
  console.error('error', err);
  process.exit(1);
};
const onUnhandledrejection: ExceptionHandler = (err) => {
  console.error('error', err);
  process.exit(1);
};
process.on('uncaughtException', onUncaughtException);
process.on('unhandledRejection', onUnhandledrejection);

const errorHandler: (
  err: any,
  req: Express.Request,
  res: Express.Response,
  next: () => void
) => void = (err, req, res, next) => {
  console.log('error', err, req);
  next();
};

export default errorHandler;
