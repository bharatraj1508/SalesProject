const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const saleSchema = new Schema({
  saleDate: {
    type: Date,
    required: true
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    tags: [{
      type: String
    }],
    price: {
      type: mongoose.Types.Decimal128,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    }
  }],
  storeLocation: {
    type: String,
    required: true
  },
  customer: {
    gender: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    satisfaction: {
      type: Number,
      required: true
    }
  },
  couponUsed: {
    type: Boolean,
    required: true
  },
  purchaseMethod: {
    type: String,
    required: true
  }
});

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;