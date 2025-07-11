const Inventory = require('../models/Inventory');
const AuditLog = require('../models/AuditLog');

// GET: Fetch full inventory sorted by SKU
const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ sku: 1 });
    res.json(inventory);
  } catch (err) {
    console.error('❌ getInventory error:', err.message);
    res.status(500).send('Server Error');
  }
};

// POST: Update quantity of an item (add or subtract)
const updateQuantity = async (req, res) => {
  const { sku, change, bin } = req.body;

  try {
    const item = await Inventory.updateStock(sku, change, bin);

    // Create audit log
    const log = new AuditLog({
      actionType: change > 0 ? 'CREATE' : 'UPDATE',
      collectionName: 'Inventory',
      documentId: item._id,
      changes: {
        oldValue: { quantity: item.quantity - change },
        newValue: { quantity: item.quantity }
      },
      user: {
        id: req.user._id,
        name: req.user.name
      }
    });

    await log.save();

    res.json(item);
  } catch (err) {
    console.error('❌ updateQuantity error:', err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = { getInventory, updateQuantity };
