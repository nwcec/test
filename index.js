// index.js

const express = require('express');

const fs = require('fs');

const path = require('path');

const morgan = require('morgan');

const app = express();

app.use(express.json({ limit: '1mb' }));

app.use(morgan('combined'));

// endpoint to receive probe logs

app.post('/probe-log', (req, res) => {

  try {

    const rec = {

      time: new Date().toISOString(),

      ip: req.ip,

      headers: req.headers,

      body: req.body

    };

    fs.appendFileSync(path.join(__dirname, 'logs.jsonl'), JSON.stringify(rec) + '\n', { encoding: 'utf8' });

    console.log('Received probe log:', JSON.stringify(rec, null, 2));

    res.json({ ok: true });

  } catch (e) {

    console.error('Error saving probe log', e);

    res.status(500).json({ ok: false, error: '' + e });

  }

});

// serve static www/

const staticDir = path.join(__dirname, 'www');

if (!fs.existsSync(staticDir)) {

  console.warn('Warning: www/ directory not found. Create www/probe.html and place it there.');

}

app.use('/', express.static(staticDir, {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// simple viewer for logs

app.get('/logs', (req, res) => {

  const file = path.join(__dirname, 'logs.jsonl');

  if (!fs.existsSync(file)) return res.send('no logs yet');

  const lines = fs.readFileSync(file, 'utf8').trim().split('\n').reverse();

  const recent = lines.slice(0, 100).map(l => {

    try { return JSON.parse(l); } catch (e) { return { raw: l }; }

  });

  res.setHeader('Content-Type', 'application/json');

  res.send(JSON.stringify(recent, null, 2));

});

// healthcheck

app.get('/health', (req, res) => res.send({ ok: true }));

const port = process.env.PORT || 5000;

app.listen(port, '0.0.0.0', () => console.log(`probe server listening on port ${port}`));
