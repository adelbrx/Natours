const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Model } = require('mongoose');
const APIFeatures = require('../utils/apiFeatures');

///////////////// CREATE ////////////////
exports.createOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const doc = await Model.create(request.body);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    response.status(201).json({
      status: 'success',
      data: doc,
    });
  });

///////////////// READ ////////////////
exports.getOne = (Model, popOptions) =>
  catchAsync(async (request, response, next) => {
    let query = Model.findById(request.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    response.status(200).json({
      status: 'Success',
      data: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (request, response, next) => {
    //To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (request.params.tour)
      filter = {
        tour: request.params.tour,
      };

    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), request.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    response.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });

///////////////// UPDATE ////////////////
exports.updateOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const doc = await Model.findByIdAndUpdate(request.params.id, request.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    response.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

///////////////// DELETE ////////////////
exports.deleteOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const doc = await Model.findByIdAndRemove(request.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    response.status(204).json({
      status: 'success',
      data: null,
    });
  });
