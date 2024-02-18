const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (request, response, next) => {
  // 1) Get the current booked tour
  const tour = await Tour.findById(request.params.tourID);
  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    //informations about session
    payment_method_types: ['card'],
    success_url: `${request.protocol}://${request.get('host')}/?tour=${
      request.params.tourID
    }&user=${request.user.id}&price=${tour.price}`,
    cancel_url: `${request.protocol}://${request.get('host')}/tour/${
      tour.slug
    }`,
    customer_email: request.user.email,
    client_reference_id: request.params.tourID,
    mode: 'payment',

    //informations about product
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  response.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (request, response, next) => {
  // this is only TEMPORARY, because it's UNSECURE: everyone can make bookings withoout paying
  const { tour, user, price } = request.query;

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  response.redirect(request.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
