import { useState, useEffect } from 'react';
import { salesAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { DEPARTMENTS, SALE_STATUS, PAYMENT_METHODS } from '../../utils/constants';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSales();
  }, [filters, pagination.page]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: 20,
      };
      const response = await salesAPI.getAll(params);
      setSales(response.data.data);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total,
      });
    } catch (error) {
      toast.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const viewSaleDetails = async (sale) => {
    try {
      const response = await salesAPI.getOne(sale._id);
      setSelectedSale(response.data.data);
      setIsDetailOpen(true);
    } catch (error) {
      toast.error('Failed to load sale details');
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = SALE_STATUS[status] || { label: status, color: 'default' };
    return <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const columns = [
    {
      key: 'saleNumber',
      title: 'Sale #',
      render: (value) => <span className="font-mono">{value}</span>,
    },
    {
      key: 'items',
      title: 'Items',
      render: (items) => `${items?.length || 0} item(s)`,
    },
    {
      key: 'totalAmount',
      title: 'Total',
      render: (amount) => (
        <span className="font-semibold">{formatCurrency(amount)}</span>
      ),
    },
    {
      key: 'paymentMethod',
      title: 'Payment',
      render: (method) => (
        <span className="capitalize">{method}</span>
      ),
    },
    {
      key: 'soldBy',
      title: 'Sold By',
      render: (soldBy) => (
        <div>
          <p>{soldBy?.firstName} {soldBy?.lastName}</p>
          <p className="text-xs text-gray-500">{soldBy?.department}</p>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (status) => getStatusBadge(status),
    },
    {
      key: 'createdAt',
      title: 'Date',
      render: (date) => formatDateTime(date),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Sales History</h1>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
          <Select
            label="Status"
            placeholder="All Statuses"
            options={Object.entries(SALE_STATUS).map(([value, { label }]) => ({ value, label }))}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          />
        </div>
      </Card>

      {/* Sales Table */}
      <Card>
        <Table
          columns={columns}
          data={sales}
          loading={loading}
          emptyMessage="No sales found"
          onRowClick={viewSaleDetails}
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Sale Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Sale Details - ${selectedSale?.saleNumber}`}
        size="lg"
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{formatDateTime(selectedSale.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                {getStatusBadge(selectedSale.status)}
              </div>
              <div>
                <p className="text-gray-500">Sold By</p>
                <p className="font-medium">
                  {selectedSale.soldBy?.firstName} {selectedSale.soldBy?.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Payment Method</p>
                <p className="font-medium capitalize">{selectedSale.paymentMethod}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Items</h4>
              <div className="space-y-2">
                {selectedSale.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.unitType === 'bag' ? (
                        <p className="text-sm text-gray-500">
                          {item.quantityBags > 0 && `${item.quantityBags} bag(s) `}
                          {item.quantityHalfBags > 0 && `${item.quantityHalfBags} 1/2 bag(s) `}
                          {item.quantityThirdBags > 0 && `${item.quantityThirdBags} 1/3 bag(s) `}
                          {item.quantityPaints > 0 && `${item.quantityPaints} paint(s) `}
                          {item.quantityHalfPaints > 0 && `${item.quantityHalfPaints} 1/2 paint(s)`}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      )}
                    </div>
                    <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-xl font-bold text-primary-600">
                {formatCurrency(selectedSale.totalAmount)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesList;
