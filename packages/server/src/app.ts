import next from 'next';
import path from 'path';

const dev = process.env.NODE_ENV !== 'production';
const dir = path.resolve(__dirname, '../../frontend');
const app = next({ dev, dir });

export default app;
