const mongoose = require('mongoose');
//const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour Validator must have less or equal then 40 characters',
      ],
      minlength: [
        10,
        'A tour Validator must have more or equal then 10 characters',
      ],
    },

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      trim: true,
    },

    ratingAverage: {
      type: Number,
      default: 4.5,
    },

    ratingQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },

    priceDiscount: Number,

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },

    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      trim: true,
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },

    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinate: [Number],
      address: String,
      description: String,
      day: Number,
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinate: [Number],
        address: String,
        description: String,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual('durationWeek').get(function () {
  return this.duration / 7;
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

const Tour = new mongoose.model('Tour', tourSchema);

module.exports = Tour;
