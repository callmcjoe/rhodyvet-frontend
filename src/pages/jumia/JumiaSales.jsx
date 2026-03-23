import { useState, useEffect } from 'react';
import { salesAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import { SALE_STATUS } from '../../utils/constants';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const JumiaSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [summary, setSummary] = useState({ totalSales: 0, totalAmount: 0 });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
  });

  useEffect(() => {
    fetchSales();
  }, [filters, pagination.page]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        salesChannel: 'jumia', // Always filter by Jumia channel
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

      // Calculate summary from loaded sales
      const totalAmount = response.data.data.reduce((sum, sale) => sum + sale.totalAmount, 0);
      setSummary({
        totalSales: response.data.total,
        totalAmount,
      });
    } catch (error) {
      toast.error('Failed to fetch Jumia sales');
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
        <span className="font-semibold text-orange-600">{formatCurrency(amount)}</span>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-semibold text-gray-900">Jumia Sales</h1>
          <Badge variant="warning" size="lg">Jumia Channel</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600">Total Jumia Sales</p>
          <p className="text-2xl font-bold text-orange-700">{summary.totalSales}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600">Total Revenue (This Page)</p>
          <p className="text-2xl font-bold text-orange-700">{formatCurrency(summary.totalAmount)}</p>
        </div>
      </div>

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
          emptyMessage="No Jumia sales found"
          onRowClick={viewSaleDetails}
        />

        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          total={pagination.total}
          onPageChange={(newPage) => setPagination({ ...pagination, page: newPage })}
        />
      </Card>

      {/* Sale Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Jumia Sale - ${selectedSale?.saleNumber}`}
        size="lg"
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-800">
              This is a <strong>Jumia</strong> channel sale.
            </div>

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
                          {item.quantityQuarterBags > 0 && `${item.quantityQuarterBags} 1/4 bag(s) `}
                          {item.quantityPaints > 0 && `${item.quantityPaints} paint(s) `}
                          {item.quantityHalfPaints > 0 && `${item.quantityHalfPaints} 1/2 paint(s)`}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} {item.saleUnitName || 'unit(s)'}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedSale.subtotalAmount)}</span>
              </div>
              {selectedSale.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(selectedSale.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold text-orange-600">
                  {formatCurrency(selectedSale.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JumiaSales;
