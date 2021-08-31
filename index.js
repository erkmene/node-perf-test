const cors = require('cors');
const createError = require('http-errors');
const debug = require('debug')('perf-test');
const express = require('express');
const fs = require('fs');
const logger = require('morgan');
const path = require('path');

if (fs.existsSync(`./config/.env.${process.env.NODE_ENV}`)) {
  require('dotenv').config({
    path: `./config/.env.${process.env.NODE_ENV}`,
  });
}

const bootstrapRoutes = require('./routes');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

let whitelist = process.env.CORS_WHITELIST || '';
whitelist = whitelist.split(',').map((domain) => {
  return domain.trim();
});
app.use(
  cors({
    origin: whitelist,
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

bootstrapRoutes(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler (next is important for some reason)
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'local' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  debug(`TC-API ready at port ${port}`);
});

module.exports = app;
