const { request } = require('../app');
const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserIds = (request, response, next) => {
  //allow nested route
  console.log(request);
  if (!request.body.tour) request.body.tour = request.params.tour;
  if (!request.body.user) request.body.user = request.user.id;
  next();
};

///////////////// CREATE ////////////////
exports.createReview = factory.createOne(Review);

///////////////// READ ////////////////
exports.getReview = factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);

///////////////// UPDATE ////////////////
exports.updateReview = factory.updateOne(Review);

///////////////// DELETE ////////////////
exports.deleteReview = factory.deleteOne(Review);
