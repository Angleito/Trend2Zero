const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Filter object to only allow certain fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Get current user
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// Update current user data
exports.updateMe = catchAsync(async (req, res, next) => {
  // Create error if user tries to update password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }
  
  // Filter out unwanted fields that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  
  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

// Delete current user (set active to false)
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get user by ID
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Get all users (admin only)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

// Create new user (admin only)
exports.createUser = catchAsync(async (req, res, next) => {
  return next(
    new AppError(
      'This route is not defined! Please use /signup instead',
      400
    )
  );
});

// Update user (admin only)
exports.updateUser = catchAsync(async (req, res, next) => {
  // Do NOT update passwords with this!
  const filteredBody = filterObj(req.body, 'name', 'email', 'role');
  
  const user = await User.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true
  });
  
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Delete user (admin only)
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get user watchlist
exports.getWatchlist = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    status: 'success',
    results: user.watchlist.length,
    data: {
      watchlist: user.watchlist
    }
  });
});

// Add asset to watchlist
exports.addToWatchlist = catchAsync(async (req, res, next) => {
  const { assetSymbol, assetType } = req.body;
  
  if (!assetSymbol || !assetType) {
    return next(new AppError('Please provide asset symbol and type', 400));
  }
  
  const user = await User.findById(req.user.id);
  await user.addToWatchlist(assetSymbol, assetType);
  
  res.status(200).json({
    status: 'success',
    data: {
      watchlist: user.watchlist
    }
  });
});

// Remove asset from watchlist
exports.removeFromWatchlist = catchAsync(async (req, res, next) => {
  const { assetSymbol } = req.params;
  
  if (!assetSymbol) {
    return next(new AppError('Please provide asset symbol', 400));
  }
  
  const user = await User.findById(req.user.id);
  await user.removeFromWatchlist(assetSymbol);
  
  res.status(200).json({
    status: 'success',
    data: {
      watchlist: user.watchlist
    }
  });
});
