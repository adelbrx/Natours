const User = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

const filterObj = (object, ...allowedFields) => {
  const newObj = {};
  Object.keys(object).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = object[key];
  });
  return newObj;
};

// const multerStorage = multer.diskStorage({
//   destination: (request, file, callbackFunction) => {
//     callbackFunction(null, 'public/img/users');
//   },
//   filename: (request, file, callbackFunction) => {
//     //user-id-currentTimesTamp.jpeg FORMAT
//     const extension = file.mimetype.split('/')[1];
//     callbackFunction(
//       null,
//       `user-${request.user.id}-${Date.now()}.${extension}`
//     );
//   },
// });

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

///////////////// READ ////////////////
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

///////////////// UPDATE ////////////////
exports.updateUser = factory.updateOne(User);

///////////////// DELETE ////////////////
exports.deleteUser = factory.deleteOne(User);

exports.createUser = (request, response) => {
  response.status(500).json({
    status: 'error',
    message: 'Rhis rout is not defined! Please use /signup instead',
  });
};

exports.getMe = (request, response, next) => {
  request.params.id = request.user._id;
  next();
};

exports.updateMe = catchAsync(async (request, response, next) => {
  // 1) Create error if user POTSs password data
  if (request.body.password || request.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );
  }

  // 2) Filter the body
  const filteredBody = filterObj(request.body, 'name', 'email');
  if (request.file) filteredBody.photo = request.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(
    request.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );
  response.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (request, response, next) => {
  await User.findByIdAndUpdate(request.user.id, { active: false });

  response.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (request, response, next) => {
  if (!request.file) next();

  request.file.filename = `user-${request.user.id}-${Date.now()}.jpeg`;
  await sharp(request.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${request.file.filename}`);

  next();
});
