import { useState, useEffect } from 'react';
import { stockAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import { DEPARTMENTS, STOCK_ACTION_TYPES } from '../../utils/constants';
import { formatDateTime, getDepartmentBadgeColor, paintsToDisplay, formatStoreQuantity } from '../../utils/helpers';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import { PlusIcon, MinusIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const StockManagement = () => {
  const [stock, setStock] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionType, setActionType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [quantityInBags, setQuantityInBags] = useState('');
  const [quantityInStockUnits, setQuantityInStockUnits] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newStockInStockUnits, setNewStockInStockUnits] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchStock();
  }, [departmentFilter, debouncedSearch, pagination.page]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [departmentFilter, debouncedSearch]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 20,
      };
      if (departmentFilter) params.department = departmentFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await stockAPI.getOverview(params);
      setStock(response.data.data);
      setSummary(response.data.summary);
      setPagination({
        page: response.data.page || 1,
        pages: response.data.pages || 1,
        total: response.data.total || response.data.count || 0,
      });
    } catch (error) {
      toast.error('Failed to fetch stock');
    } finally {
      setLoading(false);
    }
  };

  const openStockModal = (product, action) => {
    setSelectedProduct(product);
    setActionType(action);
    setQuantity('');
    setQuantityInBags('');
    setQuantityInStockUnits('');
    setNewStock('');
    setNewStockInStockUnits('');
    setNotes('');
    setIsModalOpen(true);
  };

  const viewProductLogs = async (product) => {
    try {
      const response = await stockAPI.getProductLogs(product._id);
      setStockLogs(response.data.data);
      setSelectedProduct(product);
      setIsLogsOpen(true);
    } catch (error) {
      toast.error('Failed to fetch stock logs');
    }
  };

  const handleStockAction = async () => {
    if (actionType === 'adjust' && !notes.trim()) {
      toast.error('Notes are required for stock adjustment');
      return;
    }

    setProcessing(true);
    try {
      const data = {
        notes,
      };

      if (selectedProduct.unitType === 'bag') {
        // Feeds products - use bags
        if (actionType === 'adjust') {
          data.newStockInBags = parseFloat(quantityInBags) || 0;
        } else {
          data.quantityInBags = parseFloat(quantityInBags) || 0;
        }
      } else if (selectedProduct.stockUnit && selectedProduct.stockUnitEquivalent) {
        // Store products with stock unit conversion
        if (actionType === 'adjust') {
          // Convert stock units to base units
          const stockUnits = parseFloat(newStockInStockUnits) || 0;
          data.newStock = stockUnits * selectedProduct.stockUnitEquivalent;
        } else {
          // Convert stock units to base units
          const stockUnits = parseFloat(quantityInStockUnits) || 0;
          data.quantity = stockUnits * selectedProduct.stockUnitEquivalent;
        }
      } else {
        // Legacy store products without stock unit
        if (actionType === 'adjust') {
          data.newStock = parseInt(newStock);
        } else {
          data.quantity = parseInt(quantity);
        }
      }

      if (actionType === 'add') {
        await stockAPI.addStock(selectedProduct._id, data);
        toast.success('Stock added successfully');
      } else if (actionType === 'remove') {
        await stockAPI.removeStock(selectedProduct._id, data);
        toast.success('Stock removed successfully');
      } else {
        await stockAPI.adjustStock(selectedProduct._id, data);
        toast.success('Stock adjusted successfully');
      }

      setIsModalOpen(false);
      fetchStock();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setProcessing(false);
    }
  };

  const getActionBadge = (actionType) => {
    const info = STOCK_ACTION_TYPES[actionType] || { label: actionType, color: 'default' };
    return <Badge variant={info.color}>{info.label}</Badge>;
  };

  const columns = [
    {
      key: 'name',
      title: 'Product',
    },
    {
      key: 'department',
      title: 'Department',
      render: (dept) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDepartmentBadgeColor(dept)}`}>
          {dept}
        </span>
      ),
    },
    {
      key: 'stockDisplay',
      title: 'Current Stock',
      render: (display, row) => (
        <div>
          <p className={row.isLowStock ? 'text-red-600 font-medium' : ''}>
            {display}
          </p>
          {row.unitType === 'bag' && (
            <p className="text-xs text-gray-500">{row.stockInBags} bags</p>
          )}
        </div>
      ),
    },
    {
      key: 'isLowStock',
      title: 'Status',
      render: (isLow) => (
        <Badge variant={isLow ? 'danger' : 'success'}>
          {isLow ? 'Low Stock' : 'OK'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openStockModal(row, 'add')}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Add Stock"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => openStockModal(row, 'remove')}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Remove Stock"
          >
            <MinusIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => openStockModal(row, 'adjust')}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Adjust Stock"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => viewProductLogs(row)}
            className="text-sm text-primary-600 hover:underline"
          >
            History
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Stock Management</h1>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold">{summary.totalProducts}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Low Stock</p>
            <p className="text-2xl font-bold text-red-600">{summary.lowStockCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Feeds Products</p>
            <p className="text-2xl font-bold text-amber-600">{summary.feedsProducts}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Store Products</p>
            <p className="text-2xl font-bold text-blue-600">{summary.storeProducts}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Select
            placeholder="All Departments"
            options={DEPARTMENTS}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Stock Table */}
      <Card>
        <Table
          columns={columns}
          data={stock}
          loading={loading}
          emptyMessage="No products found"
        />
        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          total={pagination.total}
          onPageChange={(newPage) => setPagination({ ...pagination, page: newPage })}
        />
      </Card>

      {/* Stock Action Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${actionType === 'add' ? 'Add' : actionType === 'remove' ? 'Remove' : 'Adjust'} Stock - ${selectedProduct?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Current Stock</p>
            <p className="font-semibold">{selectedProduct?.stockDisplay}</p>
          </div>

          {actionType !== 'adjust' ? (
            <>
              {selectedProduct?.unitType === 'bag' ? (
                <Input
                  label={`Bags to ${actionType}`}
                  type="number"
                  min="0"
                  value={quantityInBags}
                  onChange={(e) => setQuantityInBags(e.target.value)}
                  placeholder="e.g., 5"
                />
              ) : selectedProduct?.stockUnit && selectedProduct?.stockUnitEquivalent ? (
                <div>
                  <Input
                    label={`${selectedProduct.stockUnit}s to ${actionType}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantityInStockUnits}
                    onChange={(e) => setQuantityInStockUnits(e.target.value)}
                    placeholder={`e.g., 5 ${selectedProduct.stockUnit}s`}
                    required
                  />
                  {quantityInStockUnits && (
                    <p className="text-xs text-gray-500 mt-1">
                      = {(parseFloat(quantityInStockUnits) || 0) * selectedProduct.stockUnitEquivalent} {selectedProduct.baseUnit}
                    </p>
                  )}
                </div>
              ) : (
                <Input
                  label={`${selectedProduct?.baseUnit || 'Units'} to ${actionType}`}
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              )}
            </>
          ) : (
            <>
              {selectedProduct?.unitType === 'bag' ? (
                <Input
                  label="New Stock (Bags)"
                  type="number"
                  min="0"
                  value={quantityInBags}
                  onChange={(e) => setQuantityInBags(e.target.value)}
                  placeholder="e.g., 10"
                  required
                />
              ) : selectedProduct?.stockUnit && selectedProduct?.stockUnitEquivalent ? (
                <div>
                  <Input
                    label={`New Stock (${selectedProduct.stockUnit}s)`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={newStockInStockUnits}
                    onChange={(e) => setNewStockInStockUnits(e.target.value)}
                    placeholder={`e.g., 10 ${selectedProduct.stockUnit}s`}
                    required
                  />
                  {newStockInStockUnits && (
                    <p className="text-xs text-gray-500 mt-1">
                      = {(parseFloat(newStockInStockUnits) || 0) * selectedProduct.stockUnitEquivalent} {selectedProduct.baseUnit}
                    </p>
                  )}
                </div>
              ) : (
                <Input
                  label={`New Stock (${selectedProduct?.baseUnit || 'Quantity'})`}
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  required
                />
              )}
            </>
          )}

          <Input
            label={`Notes${actionType === 'adjust' ? ' (Required)' : ''}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason for stock change"
            required={actionType === 'adjust'}
          />

          <div className="flex space-x-3 pt-4">
            <Button variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleStockAction}
              loading={processing}
              variant={actionType === 'remove' ? 'danger' : 'primary'}
            >
              {actionType === 'add' ? 'Add Stock' : actionType === 'remove' ? 'Remove Stock' : 'Adjust Stock'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stock Logs Modal */}
      <Modal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        title={`Stock History - ${selectedProduct?.name}`}
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto">
          {stockLogs.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No history available</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Action</th>
                  <th className="table-header">Change</th>
                  <th className="table-header">By</th>
                  <th className="table-header">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stockLogs.map(log => (
                  <tr key={log._id}>
                    <td className="table-cell">{getActionBadge(log.actionType)}</td>
                    <td className="table-cell">
                      {selectedProduct?.unitType === 'bag' ? (
                        <span className={log.quantityChangedInPaints > 0 ? 'text-green-600' : 'text-red-600'}>
                          {log.quantityChangedInPaints > 0 ? '+' : '-'}{paintsToDisplay(Math.abs(log.quantityChangedInPaints))}
                        </span>
                      ) : (
                        <span className={log.quantityChangedInQuantity > 0 ? 'text-green-600' : 'text-red-600'}>
                          {log.quantityChangedInQuantity > 0 ? '+' : '-'}{formatStoreQuantity(Math.abs(log.quantityChangedInQuantity), selectedProduct)}
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      {log.performedBy?.firstName} {log.performedBy?.lastName}
                    </td>
                    <td className="table-cell">{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StockManagement;
