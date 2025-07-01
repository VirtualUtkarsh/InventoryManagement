import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function OutsetPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOutsetModal, setShowOutsetModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [outsetItems, setOutsetItems] = useState([]);
  const [loading, setLoading] = useState({
    inventory: true,
    outsets: true
  });

  // Fetch inventory and historical outset data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inventoryRes, outsetsRes] = await Promise.all([
          axios.get('/api/inventory'),
          axios.get('/api/outset')
        ]);
        
        setInventory(inventoryRes.data.filter(item => item.quantity > 0));
        setOutsetItems(outsetsRes.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading({ inventory: false, outsets: false });
      }
    };
    fetchData();
  }, []);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCustomerName('');
    setInvoiceNo('');
    setShowProductModal(false);
    setShowOutsetModal(true);
  };

  const handleConfirmOutset = async () => {
    if (!selectedProduct || !customerName || !invoiceNo) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      // Start loading state for new record
      setLoading(prev => ({ ...prev, outsets: true }));

      const { data } = await axios.post('/api/outset', {
        sku: selectedProduct.sku,
        quantity: parseInt(quantity),
        customerName,
        invoiceNo,
        userId: user.id,
        userName: user.name,
        bin: selectedProduct.bin
      });

      // Update local state with new record at the top
      setOutsetItems(prev => [data, ...prev]);
      
      // Refresh available inventory
      const { data: updatedInventory } = await axios.get('/api/inventory');
      setInventory(updatedInventory.filter(item => item.quantity > 0));

      toast.success('Outbound item recorded successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record outbound');
    } finally {
      // Reset form and loading state
      setSelectedProduct(null);
      setShowOutsetModal(false);
      setLoading(prev => ({ ...prev, outsets: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Outbound Management</h1>
        <button
          onClick={() => setShowProductModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          + New Outbound
        </button>
      </div>

      {/* Current Inventory Summary (for reference) */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Available Inventory</h2>
        {loading.inventory ? (
          <div className="text-center py-4">Loading inventory...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.slice(0, 3).map(item => (
              <div key={item._id} className="border p-3 rounded-lg">
                <div className="font-medium text-gray-800">{item.name || `Item ${item.sku}`}</div>
                <div className="text-sm text-gray-600">SKU: {item.sku} | Qty: {item.quantity} | Bin: {item.bin}</div>
              </div>
            ))}
            {inventory.length > 3 && (
              <div className="border p-3 rounded-lg bg-gray-50">
                + {inventory.length - 3} more items available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical Outbound Records */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Outbound History</h2>
          <span className="text-sm text-gray-500">
            {outsetItems.length} total records
          </span>
        </div>

        {loading.outsets ? (
          <div className="text-center py-8">Loading outbound records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outsetItems.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.name || `Item ${item.sku}`}</div>
                      <div className="text-xs text-gray-500">Invoice: {item.invoiceNo}</div>
                      <div className="text-xs text-gray-500">Bin: {item.bin}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        -{item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.user?.name || 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Select Product to Remove</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {inventory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No available inventory items
                </div>
              ) : (
                <div className="space-y-2">
                  {inventory.map(product => (
                    <div
                      key={product._id}
                      onClick={() => handleProductSelect(product)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium">{product.name || `Item ${product.sku}`}</div>
                      <div className="text-sm text-gray-600">
                        SKU: {product.sku} | Available: {product.quantity} | Bin: {product.bin}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outbound Confirmation Modal */}
      {showOutsetModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Confirm Outbound Transfer</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="font-medium text-gray-900">
                  {selectedProduct.name || `Item ${selectedProduct.sku}`}
                </div>
                <div className="text-sm text-gray-600">
                  SKU: {selectedProduct.sku} | Available: {selectedProduct.quantity} | Bin: {selectedProduct.bin}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Remove *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.quantity}
                  value={quantity}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(Number(e.target.value), selectedProduct.quantity));
                    setQuantity(val);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum available: {selectedProduct.quantity}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter customer or department name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice/Reference Number *</label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Required for audit trail"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowOutsetModal(false);
                  setShowProductModal(true);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmOutset}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                disabled={loading.outsets}
              >
                {loading.outsets ? 'Processing...' : 'Confirm Outbound'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
