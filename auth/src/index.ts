import express from 'express';
import {config} from 'dotenv';

import { authenticateUser } from './auth';

config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.all('/validate_token', authenticateUser);

app.listen(port, () => {
  console.log(`Auth service listening at http://localhost:${port}`);
});
export default app;
