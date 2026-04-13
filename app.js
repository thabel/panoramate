const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false; // production
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(process.env.PORT || 3000, () => {
      console.log('Next.js app running...');
    });
  })
  .catch(err => {
    console.error('Startup error:', JSON.stringify(err, null, 2));
  });