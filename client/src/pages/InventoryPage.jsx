import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import InventoryTable from '../components/InventoryTable';
import 'react-toastify/dist/ReactToastify.css';

const InventoryPage = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data } = await axios.get('/api/inventory');
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setInventory(sortedData);
      } catch (err) {
        setError('Failed to fetch inventory');
        toast.error('Error loading inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const totalItems = inventory.length;
  const lowStockCount = inventory.filter(item => item.quantity < 5).length;
  const uniqueBins = new Set(inventory.map(item => item.bin)).size;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">📦 VeroLie Inventory</h1>
          <img 
            src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/a5d620f0-d980-4974-a74f-886f2a630962.png"
            alt="Warehouse visual"
            className="rounded-md shadow-sm mb-2 w-full max-w-md mx-auto"
          />
          <p className="text-gray-700 text-sm">
            This is the Inventory page. Navigate to Outsets or Insets from the menu above.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-100 text-blue-800 p-3 rounded-md shadow-sm">
            <h4 className="text-xs font-semibold">Total Items</h4>
            <p className="text-lg font-bold">{totalItems}</p>
          </div>
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md shadow-sm">
            <h4 className="text-xs font-semibold">Low Stock (&lt; 5)</h4>
            <p className="text-lg font-bold">{lowStockCount}</p>
          </div>
          <div className="bg-green-100 text-green-800 p-3 rounded-md shadow-sm">
            <h4 className="text-xs font-semibold">Unique Bins</h4>
            <p className="text-lg font-bold">{uniqueBins}</p>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto mt-6">
          {loading ? (
            <p className="text-center text-gray-600">Loading inventory...</p>
          ) : error ? (
            <div className="bg-red-100 text-red-800 p-3 rounded-md">{error}</div>
          ) : inventory.length === 0 ? (
            <p className="text-center text-gray-500">No inventory records found.</p>
          ) : (
            <InventoryTable inventory={inventory} />
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
