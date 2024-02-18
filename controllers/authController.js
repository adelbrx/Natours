const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const { use } = require('../app');
const { promisify } = require('util');
const { request } = require('http');
const crypto = require('crypto');
const app = require('../app');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, response) => {
  const token = signToken(user._id);

  response.cookie('jwt', token, {
    expiresIn: new Date(
      Date.now() +
        process.env.JWT_COOKIE_EXPIRES_IN +
        1000 * 24 * 60 * 60 * 1000
    ),
    secure: true, //the cookie will be send with an encrypted connection (HTTPS)
    httpOnly: true, //use only http secure protocol
  });

  response.status(statusCode).json({
    status: 'success',
    token: token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (request, response, next) => {
  const newUser = await User.create(request.body);
  const url = `${request.protocol}://${request.get('host')}:3000/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, response);
});

exports.login = catchAsync(async (request, response, next) => {
  const { email, password } = request.body;

  // 1)  Check if email and password exists
  if (!email || !password) {
    return next(new AppError(`Please provide email and password`, 404));
  }
  // 2)  Check if user exists && password is correct
  const user = await User.findOne({ email: email }).select('+password');
  const correct = await user.correctPassword(password, user.password);

  if (!correct) return next(new AppError('Incorrect email or password', 401));

  // 3)  If everythong is okey, send token to client
  createSendToken(user, 200, response);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (request, response, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith('Bearer')
  ) {
    token = request.headers.authorization.split(' ')[1];
  } else if (request.cookies.jwt) {
    token = request.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  request.user = currentUser;
  response.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  console.log(req.cookie);
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (request, response, next) => {
    if (!roles.includes(request.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (request, response, next) => {
  //Generate user based on POSTed email
  const user = await User.findOne({ email: request.body.email });

  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  //Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  //Send it to User's email

  // const message = `Forgot your password ? Submit a PATCH request with your new password and passwordConfirm to : ${resetURL} . If you didn't forget your password, Please ignore this email`;

  try {
    const resetURL = `${request.protocol}://${request.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    response.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email, Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (request, response, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(request.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) Update changedPasswordAt property for the user

  // 4) Log the user in, send JWT
  createSendToken(user, 200, response);
});

exports.updatePassword = catchAsync(async (request, response, next) => {
  // 1) Get user from collection
  const currentUser = await User.findOne({ email: request.body.email }).select(
    '+password'
  );
  if (!currentUser) {
    return next(
      new AppError('This email is not valid, PLease try a valid one', 404)
    );
  }

  // 2) Check if POSTed current password is correct
  if (
    !(await currentUser.correctPassword(
      request.body.currentPassword,
      currentUser.password
    ))
  ) {
    return next(new AppError('Password wrong, Please try again!', 401));
  }

  // 3) If so, update password
  currentUser.password = request.body.password;
  currentUser.passwordConfirm = request.body.password;
  await currentUser.save();

  // 4) Log user in, send JWT
  createSendToken(currentUser, 200, response);
});
