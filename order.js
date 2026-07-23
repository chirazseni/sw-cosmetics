const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  clientPhone: { type: String, required: true },
  email: { type: String, default: '' },
  wilaya: { type: String, required: true },
  commune: { type: String, required: true },
  address: { type: String, required: true },
  postalCode: { type: String, default: '' },
  deliveryType: { type: String, enum: ['Domicile', 'Bureau'], default: 'Domicile' },
  paymentMethod: { type: String, default: 'Paiement à la Livraison' },
  notes: { type: String, default: '' },
  items: [
    {
      _id: String,
      name: String,
      price: Number,
      originalPrice: Number,
      discountPercentage: Number,
      image: String,
      size: String,
      color: String,
      qty: Number
    }
  ],
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['En cours', 'Complet', 'Annulé'],
    default: 'En cours' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);