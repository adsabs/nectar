import rateLimit from 'express-rate-limit';

const config: rateLimit.Options = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 100 requests per windowMs
  skip: (req) => {
    return !!req.session;
  },
};

export default rateLimit(config);
