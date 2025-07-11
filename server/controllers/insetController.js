const Inventory = require('../models/Inventory');
const Inset = require('../models/Inset');
const AuditLog = require('../models/AuditLog');

// GET: Fetch all inventory items (alias 'name' as 'productName' for frontend)
const getInventory = async (req, res) => {
  try {
    const items = await Inventory.find({}).sort({ createdAt: -1 });

    const formattedItems = items.map(item => ({
      ...item._doc,
      productName: item.name // alias for frontend consistency
    }));

    res.status(200).json(formattedItems);
  } catch (err) {
    console.error("❌ Error in getInventory:", err.message);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
};

// POST: Create a new inset and update inventory
const createInset = async (req, res) => {
  try {
    console.log('=== INSET CREATION START ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.userId);
    console.log('Username:', req.username);

    const { sku, orderNo, bin, quantity, productName } = req.body;

    if (!sku || !orderNo || !bin || !quantity || !productName) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    console.log('✅ Validation passed');

    // Step 1: Update inventory
    console.log('📦 Updating inventory...');
    const inventoryItem = await Inventory.updateStock(
      sku,
      parseInt(quantity),
      bin,
      productName
    );
    console.log('✅ Inventory updated:', inventoryItem);

    // Step 2: Create Inset document
    const inset = new Inset({
      sku,
      name: productName, // stored in DB as 'name'
      orderNo,
      bin,
      quantity: parseInt(quantity),
      user: {
        id: req.userId,
        name: req.username
      }
    });

    await inset.save();
    console.log('✅ Inset saved to database');

    // Step 3: Audit Log
    const log = new AuditLog({
      actionType: 'CREATE',
      collectionName: 'Inset',
      documentId: inset._id,
      user: {
        id: req.userId,
        name: req.username
      }
    });

    await log.save();
    console.log('✅ Audit log created');

    console.log('=== INSET CREATION SUCCESS ===');
    res.status(201).json({
      message: 'Inset recorded successfully',
      inset,
      inventoryItem
    });

  } catch (err) {
    console.error('=== INSET CREATION ERROR ===');
    res.status(500).json({
      message: 'Server Error',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// GET: Fetch all insets with user name populated
const getInsets = async (req, res) => {
  try {
    const insets = await Inset.find()
      .sort({ createdAt: -1 })
      .populate('user.id', 'name');

    res.status(200).json(insets);
  } catch (err) {
    console.error('Error in getInsets:', err.message);
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

module.exports = {
  getInventory,
  createInset,
  getInsets
};
