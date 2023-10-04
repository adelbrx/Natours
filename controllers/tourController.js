const { response, request } = require('../app');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchASync = require('../utils/catchAsync');

////////////////////////////
/////////////////////////////////////////

exports.aliasTopTours = (request, response, next) => {
  request.query.limit = '5';
  request.query.sort = '-ratingAverage,price';
  request.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

///////////////// CREATE ////////////////
exports.createTour = catchASync(async (request, response, next) => {
  const newTour = await Tour.create(request.body);

  if (!newTour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  response.status(201).json({
    status: 'success',
    data: newTour,
  });
});

///////////////// READ ////////////////
exports.getAllTours = catchASync(async (request, response, next) => {
  //EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), request.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const allTours = await features.query;

  response.status(200).json({
    status: 'success',
    results: allTours.length,
    data: {
      tours: allTours,
    },
  });
});

exports.getTour = catchASync(async (request, response, next) => {
  const tour = await Tour.findById(request.params.id).populate('guides');

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  response.status(200).json({
    status: 'Success',
    data: tour,
  });
});

///////////////// UPDATE ////////////////
exports.updateTour = catchASync(async (request, response, next) => {
  const tour = await Tour.findByIdAndUpdate(request.params.id, request.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  response.status(200).json({
    status: 'success',
    data: {
      tour: tour,
    },
  });
});

///////////////// DELETE ////////////////
exports.deleteTour = catchASync(async (request, response, next) => {
  const tour = await Tour.findByIdAndRemove(request.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  response.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getTourStats = catchASync(async (request, response, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 },
        numRating: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1, //1 means asc and 0 mean desc
      },
    },
  ]);

  response.status(200).json({
    status: 'success',
    data: {
      stats: stats,
    },
  });
});
exports.getMonthlyPlan = catchASync(async (request, response, next) => {
  const year = request.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },

    {
      $addFields: { month: '$_id' },
    },

    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        month: 1,
      },
    },
    {
      $limit: 6,
    },
  ]);

  response.status(200).json({
    status: 'success',
    data: {
      plan: plan,
    },
  });
});
