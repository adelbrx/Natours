const { error } = require('console');
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
//////////////////////////////
dotenv.config({ path: './config.env' });

// console.log(process.env);
//////////////////////////////
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
//////////////////////////////
const app = express();
//////////////////////////////
app.use(helmet());
//////////////////////////////
const limiter = rateLimit({
  //this is a middleware function
  //{options}
  max: 100, //allow 100 request from the same IP
  windowMs: 60 * 60 * 1000, //allow them for 1 hour  (windows MilliSecond)
  message: 'Too many request from this IP, Please try again in an hour', //error message
});
app.use('/api', limiter);
//////////////////////////////

app.use(express.json({ limit: '10kb' }));

//Data Sanitization against NoSQL query injection attack
app.use(mongoSanitize());

//Data Sanitization against XSS attack
app.use(xss());

//Prevent paramater pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingQuantity',
      'ratingAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ], //an array of properties that allow to duplicate query string
  })
);

app.use(morgan('dev'));
app.use(express.static(`${__dirname}/public`));
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);

//for all others link with all http methods
app.all('*', (request, response, next) => {
  next(new AppError(`Can't find ${request.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
