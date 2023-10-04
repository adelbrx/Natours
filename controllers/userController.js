const User = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const filterObj = (object, ...allowedFields) => {
  const newObj = {};
  Object.keys(object).forEach((key) => {
    if (allowedFields.includes(key)) newObj[key] = object[key];
  });
  return newObj;
};

exports.createUser = (request, response) => {
  //
  response.status(500).json({
    status: 'success',
    message: 'This route is not yet defined',
  });
};
exports.getUser = (request, response) => {
  //
  response.status(500).json({
    status: 'success',
    message: 'This route is not yet defined',
  });
};
exports.getAllUsers = async (request, response, next) => {
  const users = new APIFeatures(User.find(), request.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const allUsers = await users.query;

  response.status(500).json({
    status: 'success',
    results: allUsers.length,
    data: {
      users: allUsers,
    },
  });
};

exports.updateUser = (request, response) => {
  //
  response.status(500).json({
    status: 'success',
    message: 'This route is not yet defined',
  });
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
exports.deleteUser = (request, response) => {
  //
  response.status(500).json({
    status: 'success',
    message: 'This route is not yet defined',
  });
};

exports.deleteMe = catchAsync(async (request, response, next) => {
  await User.findByIdAndUpdate(request.user.id, { active: false });

  response.status(204).json({
    status: 'success',
    data: null,
  });
});
