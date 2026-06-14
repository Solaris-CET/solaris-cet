import express from 'express';
import { handleChat } from './routes/chat';

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

app.post('/api/chat', handleChat);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Chat API listening on port ${port}`);
});
