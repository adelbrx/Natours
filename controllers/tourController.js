const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

////////////////////////////
/////////////////////////////////////////

const multerStorage = multer.memoryStorage();

const multerFilter = (request, file, callbackFunction) => {
  if (file.mimetype.startsWith('image')) {
    callbackFunction(null, true);
  } else {
    callbackFunction(
      new AppError('Not an image! Please upload only images.', 400),
      false
    );
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);

exports.resizeTourImages = catchAsync(async (request, response, next) => {
  if (!request.files.imageCover || !request.files.images) next();

  //  1) Cover images
  request.body.imageCover = `tour-${
    request.params.id
  }-${Date.now()}-cover.jpeg`;
  await sharp(request.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${request.body.imageCoverFilename}`);

  //  2) Images
  request.body.images = [];
  await Promise.all(
    request.files.images.map(async (file, index) => {
      fileName = `tour-${request.params.id}-${Date.now()}-${index}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);

      request.body.images.push(fileName);
    })
  );
  next();
});

exports.aliasTopTours = (request, response, next) => {
  request.query.limit = '5';
  request.query.sort = '-ratingAverage,price';
  request.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

///////////////// CREATE ////////////////
exports.createTour = factory.createOne(Tour);

///////////////// READ ////////////////
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.getAllTours = factory.getAll(Tour);

///////////////// UPDATE ////////////////
exports.updateTour = factory.updateOne(Tour);

///////////////// DELETE ////////////////
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (request, response, next) => {
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

exports.getMonthlyPlan = catchAsync(async (request, response, next) => {
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

//PROBLEM 0 RESULT
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng * 1, lat * 1], radius] },
    },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

//
//   const { latlng, unit } = req.params;
//   const [lat, lng] = latlng.split(',');

//   const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

//   if (!lat || !lng) {
//     next(
//       new AppError(
//         'Please provide latitutr and longitude in the format lat,lng.',
//         400
//       )
//     );
//   }

//   const distances = await Tour.aggregate([
//     {
//       $geoNear: {
//         near: {
//           type: 'Point',
//           coordinates: [lng * 1, lat * 1],
//         },
//         distanceField: 'distance',
//         // distanceMultiplier: multiplier,
//       },
//     },
//     // {
//     //   $project: {
//     //     distance: 1,
//     //     name: 1,
//     //   },
//     // },
//   ]);

//   res.status(200).json({
//     status: 'success',
//     data: {
//       data: distances,
//     },
//   });
// });
