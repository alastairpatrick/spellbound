const path = require('path');
const Express = require('express');


const app = new Express();

const ENV = process.env.NODE_ENV || 'production';
const CLIENT_DIR = path.join(__dirname, '..', '..', 'build', 'client', ENV);
const STATIC_DIR = path.join(__dirname, '..', '..', 'static');
const PORT = 3000;
const logger = console;


app.use(Express.static(CLIENT_DIR));
app.use(Express.static(STATIC_DIR));

// start the server
app.listen(PORT, err => {
  if (err)
    return logger.error(err);

  logger.log(`Server running on http://localhost:${PORT} [${ENV}]`);
});
