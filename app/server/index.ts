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

// ── Global error handler ────────────────────────────────────────────────────
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);

  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      error: 'Eroare server internă. Vă rugăm reîncercați.',
      requestId: (req as any).id || Math.random().toString(36).slice(2),
    });
  }

  // For non-API routes, serve the SPA index.html (the React app will show ErrorBoundary)
  res.status(500).sendFile(path.join(__dirname, '../dist/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Chat API listening on port ${port}`);
});
