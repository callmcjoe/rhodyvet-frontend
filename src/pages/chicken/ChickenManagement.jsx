import { useState, useEffect } from 'react';
import { chickenAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { CHICKEN_TYPES, CHICKEN_TRANSACTION_TYPES } from '../../utils/constants';
import { formatDateTime, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ShoppingCartIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const ChickenManagement = () => {
  const [stock, setStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    transactionType: '',
    chickenType: '',
    startDate: '',
    endDate: '',
  });

  // Form data
  const [formData, setFormData] = useState({
    chickenType: '',
    quantity: '',
    pricePerUnit: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stockRes, transactionsRes] = await Promise.all([
        chickenAPI.getStock(),
        chickenAPI.getTransactions(filters),
      ]);
      setStock(stockRes.data.data);
      setTransactions(transactionsRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      chickenType: '',
      quantity: '',
      pricePerUnit: '',
      notes: '',
    });
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();

    if (!formData.chickenType || !formData.quantity || !formData.pricePerUnit) {
      toast.error('Please fill all required fields');
      return;
    }

    setProcessing(true);
    try {
      await chickenAPI.createPurchase({
        chickenType: formData.chickenType,
        quantity: parseInt(formData.quantity),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        notes: formData.notes,
      });
      toast.success('Purchase recorded successfully');
      setIsPurchaseModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record purchase');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.chickenType || !formData.quantity || !formData.pricePerUnit) {
      toast.error('Please fill all required fields');
      return;
    }

    setProcessing(true);
    try {
      await chickenAPI.createSale({
        chickenType: formData.chickenType,
        quantity: parseInt(formData.quantity),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        notes: formData.notes,
      });
      toast.success('Sale recorded successfully');
      setIsSaleModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record sale');
    } finally {
      setProcessing(false);
    }
  };

  const getStockForType = (type) => {
    const stockItem = stock.find((s) => s.chickenType === type);
    return stockItem?.currentStock || 0;
  };

  const getStockCardColor = (type) => {
    const colors = {
      broiler: 'bg-orange-50 border-orange-200',
      noiler: 'bg-blue-50 border-blue-200',
      turkey: 'bg-purple-50 border-purple-200',
    };
    return colors[type] || 'bg-gray-50';
  };

  const getStockTextColor = (type) => {
    const colors = {
      broiler: 'text-orange-700',
      noiler: 'text-blue-700',
      turkey: 'text-purple-700',
    };
    return colors[type] || 'text-gray-700';
  };

  const columns = [
    {
      key: 'transactionNumber',
      title: 'Transaction #',
      render: (val) => <span className="font-mono text-sm">{val}</span>,
    },
    {
      key: 'createdAt',
      title: 'Date',
      render: (date) => formatDateTime(date),
    },
    {
      key: 'transactionType',
      title: 'Type',
      render: (type) => (
        <Badge variant={type === 'purchase' ? 'info' : 'success'}>
          {type === 'purchase' ? 'Purchase' : 'Sale'}
        </Badge>
      ),
    },
    {
      key: 'chickenType',
      title: 'Chicken',
      render: (type) => (
        <span className="capitalize font-medium">{type}</span>
      ),
    },
    {
      key: 'quantity',
      title: 'Qty',
      render: (qty) => qty,
    },
    {
      key: 'pricePerUnit',
      title: 'Price/Unit',
      render: (price) => formatCurrency(price),
    },
    {
      key: 'totalAmount',
      title: 'Total',
      render: (total) => <span className="font-medium">{formatCurrency(total)}</span>,
    },
    {
      key: 'createdBy',
      title: 'By',
      render: (user) => `${user?.firstName || ''} ${user?.lastName || ''}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Chicken Management</h1>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => {
              resetForm();
              setIsPurchaseModalOpen(true);
            }}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Record Purchase
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsSaleModalOpen(true);
            }}
          >
            <ShoppingCartIcon className="h-5 w-5 mr-2" />
            Record Sale
          </Button>
        </div>
      </div>

      {/* Stock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHICKEN_TYPES.map((type) => (
          <div
            key={type.value}
            className={`rounded-lg border-2 p-6 ${getStockCardColor(type.value)}`}
          >
            <p className={`text-sm font-medium ${getStockTextColor(type.value)}`}>
              {type.label}
            </p>
            <p className={`text-4xl font-bold mt-2 ${getStockTextColor(type.value)}`}>
              {getStockForType(type.value)}
            </p>
            <p className="text-sm text-gray-500 mt-1">in stock</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            placeholder="All Types"
            options={CHICKEN_TYPES}
            value={filters.chickenType}
            onChange={(e) => setFilters({ ...filters, chickenType: e.target.value })}
          />
          <Select
            placeholder="All Transactions"
            options={CHICKEN_TRANSACTION_TYPES}
            value={filters.transactionType}
            onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
          />
          <Input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <Input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <Table
          columns={columns}
          data={transactions}
          loading={loading}
          emptyMessage="No transactions found"
        />
      </Card>

      {/* Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          resetForm();
        }}
        title="Record Purchase"
        size="md"
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-4">
          <Select
            label="Chicken Type"
            options={CHICKEN_TYPES}
            value={formData.chickenType}
            onChange={(e) => setFormData({ ...formData, chickenType: e.target.value })}
            required
          />
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
          <Input
            label="Cost Per Unit"
            type="number"
            min="0"
            step="0.01"
            value={formData.pricePerUnit}
            onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
            required
          />
          {formData.quantity && formData.pricePerUnit && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit))}
              </p>
            </div>
          )}
          <Input
            label="Notes (optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Supplier, batch info, etc."
          />
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setIsPurchaseModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth loading={processing}>
              Record Purchase
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sale Modal */}
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          resetForm();
        }}
        title="Record Sale"
        size="md"
      >
        <form onSubmit={handleSaleSubmit} className="space-y-4">
          <Select
            label="Chicken Type"
            options={CHICKEN_TYPES}
            value={formData.chickenType}
            onChange={(e) => setFormData({ ...formData, chickenType: e.target.value })}
            required
          />
          {formData.chickenType && (
            <p className="text-sm text-gray-500">
              Available: <span className="font-medium">{getStockForType(formData.chickenType)}</span> in stock
            </p>
          )}
          <Input
            label="Quantity"
            type="number"
            min="1"
            max={formData.chickenType ? getStockForType(formData.chickenType) : undefined}
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
          <Input
            label="Sale Price Per Unit"
            type="number"
            min="0"
            step="0.01"
            value={formData.pricePerUnit}
            onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
            required
          />
          {formData.quantity && formData.pricePerUnit && (
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-green-600">Total Sale Amount</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit))}
              </p>
            </div>
          )}
          <Input
            label="Notes (optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Customer info, etc."
          />
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setIsSaleModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth loading={processing} variant="primary">
              Record Sale
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ChickenManagement;
