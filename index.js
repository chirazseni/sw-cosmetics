console.log("🚀 السيرفر يحاول البدء الآن...");
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const Product = require('./product');
const Order = require('./order');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// ==================== ROOT ROUTE ====================
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API is running ✅' });
});

// ==================== MONGODB CONNECT ====================
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ ERREUR: MONGODB_URI ou MONGO_URI n\'est pas défini!');
  process.exit(1);
}

console.log('🔌 Tentative de connexion à MongoDB...');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connectée avec succès!');
  })
  .catch(err => {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
  });

// ==================== PRODUCTS ROUTES ====================

// GET tous les produits
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    console.log(`📦 ${products.length} produits chargés`);
    res.json(products);
  } catch (err) {
    console.error('❌ Erreur GET /products:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET produit par ID
app.get('/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    res.json(product);
  } catch (err) {
    console.error('❌ Erreur GET /products/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST créer un produit
app.post('/products', async (req, res) => {
  try {
    if (!req.body.name || !req.body.price || !req.body.image || !req.body.category) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    const product = new Product(req.body);
    await product.save();
    
    console.log(`✅ Produit créé: ${product.name}`);
    res.status(201).json(product);
  } catch (err) {
    console.error('❌ Erreur POST /products:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// PUT modifier un produit
app.put('/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    console.log(`✅ Produit modifié: ${product.name}`);
    res.json(product);
  } catch (err) {
    console.error('❌ Erreur PUT /products/:id:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// DELETE supprimer un produit
app.delete('/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    console.log(`✅ Produit supprimé: ${product.name}`);
    res.json({ message: 'Produit supprimé avec succès!' });
  } catch (err) {
    console.error('❌ Erreur DELETE /products/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== ORDERS ROUTES ====================

// GET tous les commandes
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    console.log(`📋 ${orders.length} commandes chargées`);
    res.json(orders);
  } catch (err) {
    console.error('❌ Erreur GET /orders:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST créer une commande
app.post('/orders', async (req, res) => {
  try {
    if (!req.body.clientName || !req.body.clientPhone || !req.body.items) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    const order = new Order(req.body);
    await order.save();

    console.log(`✅ Commande créée pour: ${order.clientName}`);
    res.status(201).json(order);
  } catch (err) {
    console.error('❌ Erreur POST /orders:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// PUT modifier une commande (statut)
app.put('/orders/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    console.log(`✅ Commande modifiée: ${order._id}`);
    res.json(order);
  } catch (err) {
    console.error('❌ Erreur PUT /orders/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE supprimer une commande
app.delete('/orders/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    console.log(`✅ Commande supprimée: ${order._id}`);
    res.json({ message: 'Commande supprimée avec succès!' });
  } catch (err) {
    console.error('❌ Erreur DELETE /orders/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🎉 Serveur  Collection lancé sur le port ${PORT}`);
  console.log(`🌐 API: https://sw-cosmetics.onrender.com`);
  console.log(`✅ Prêt à recevoir les requêtes!\n`);
});