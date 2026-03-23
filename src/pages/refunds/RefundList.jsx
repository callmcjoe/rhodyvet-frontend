import { useState, useEffect } from 'react';
import { refundAPI, salesAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { REFUND_STATUS } from '../../utils/constants';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const RefundList = () => {
  const [refunds, setRefunds] = useState([]);
  const [pendingRefunds, setPendingRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewRefundOpen, setIsNewRefundOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [saleNumber, setSaleNumber] = useState('');
  const [foundSale, setFoundSale] = useState(null);
  const [refundItems, setRefundItems] = useState([]);
  const [refundReason, setRefundReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchRefunds();
    if (isAdmin()) {
      fetchPendingRefunds();
    }
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await refundAPI.getAll();
      setRefunds(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch refunds');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRefunds = async () => {
    try {
      const response = await refundAPI.getPending();
      setPendingRefunds(response.data.data);
    } catch (error) {
      console.error('Failed to fetch pending refunds');
    }
  };

  const searchSale = async () => {
    if (!saleNumber.trim()) {
      toast.error('Please enter a sale number');
      return;
    }
    try {
      const response = await salesAPI.getByNumber(saleNumber);
      const sale = response.data.data;

      if (sale.status === 'fully_refunded') {
        toast.error('This sale has already been fully refunded');
        return;
      }

      setFoundSale(sale);
      setRefundItems(sale.items.map(item => ({
        ...item,
        refundQuantityBags: 0,
        refundQuantityHalfBags: 0,
        refundQuantityQuarterBags: 0,
        refundQuantityPaints: 0,
        refundQuantityHalfPaints: 0,
        refundQuantity: 0,
        selected: false,
      })));
    } catch (error) {
      toast.error('Sale not found');
      setFoundSale(null);
    }
  };

  const handleRefundSubmit = async () => {
    const selectedItems = refundItems.filter(item => item.selected);

    if (selectedItems.length === 0) {
      toast.error('Please select items to refund');
      return;
    }

    if (!refundReason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    setProcessing(true);
    try {
      const refundData = {
        saleId: foundSale._id,
        reason: refundReason,
        items: selectedItems.map(item => ({
          productId: item.product._id || item.product,
          quantity: item.refundQuantity,
          quantityBags: item.refundQuantityBags,
          quantityHalfBags: item.refundQuantityHalfBags,
          quantityQuarterBags: item.refundQuantityQuarterBags,
          quantityPaints: item.refundQuantityPaints,
          quantityHalfPaints: item.refundQuantityHalfPaints,
        })),
      };

      await refundAPI.create(refundData);
      toast.success('Refund request submitted for approval');
      setIsNewRefundOpen(false);
      resetRefundForm();
      fetchRefunds();
      if (isAdmin()) fetchPendingRefunds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit refund');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await refundAPI.approve(id);
      toast.success('Refund approved');
      fetchRefunds();
      fetchPendingRefunds();
      setIsDetailOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve refund');
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await refundAPI.reject(id, { rejectionReason });
      toast.success('Refund rejected');
      fetchRefunds();
      fetchPendingRefunds();
      setIsDetailOpen(false);
      setRejectionReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject refund');
    }
  };

  const resetRefundForm = () => {
    setSaleNumber('');
    setFoundSale(null);
    setRefundItems([]);
    setRefundReason('');
  };

  const viewRefundDetails = async (refund) => {
    try {
      const response = await refundAPI.getOne(refund._id);
      setSelectedRefund(response.data.data);
      setIsDetailOpen(true);
    } catch (error) {
      toast.error('Failed to load refund details');
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = REFUND_STATUS[status] || { label: status, color: 'default' };
    return <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const columns = [
    {
      key: 'refundNumber',
      title: 'Refund #',
      render: (value) => <span className="font-mono">{value}</span>,
    },
    {
      key: 'saleNumber',
      title: 'Sale #',
      render: (value) => <span className="font-mono">{value}</span>,
    },
    {
      key: 'totalRefundAmount',
      title: 'Amount',
      render: (amount) => (
        <span className="font-semibold text-red-600">{formatCurrency(amount)}</span>
      ),
    },
    {
      key: 'requestedBy',
      title: 'Requested By',
      render: (user) => `${user?.firstName || ''} ${user?.lastName || ''}`,
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Refunds</h1>
        <Button onClick={() => setIsNewRefundOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          New Refund
        </Button>
      </div>

      {/* Pending Refunds for Admin */}
      {isAdmin() && pendingRefunds.length > 0 && (
        <Card title="Pending Approvals" className="border-l-4 border-yellow-500">
          <div className="space-y-3">
            {pendingRefunds.map(refund => (
              <div
                key={refund._id}
                className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100"
                onClick={() => viewRefundDetails(refund)}
              >
                <div>
                  <p className="font-medium">{refund.refundNumber}</p>
                  <p className="text-sm text-gray-500">
                    {refund.requestedBy?.firstName} {refund.requestedBy?.lastName} - {formatDateTime(refund.createdAt)}
                  </p>
                </div>
                <span className="font-semibold text-red-600">
                  {formatCurrency(refund.totalRefundAmount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Refunds */}
      <Card>
        <Table
          columns={columns}
          data={refunds}
          loading={loading}
          emptyMessage="No refunds found"
          onRowClick={viewRefundDetails}
        />
      </Card>

      {/* New Refund Modal */}
      <Modal
        isOpen={isNewRefundOpen}
        onClose={() => { setIsNewRefundOpen(false); resetRefundForm(); }}
        title="Request Refund"
        size="lg"
      >
        <div className="space-y-4">
          {!foundSale ? (
            <div className="flex space-x-2">
              <Input
                placeholder="Enter Sale Number (e.g., SAL-240125-0001)"
                value={saleNumber}
                onChange={(e) => setSaleNumber(e.target.value)}
                className="flex-1"
              />
              <Button onClick={searchSale}>Search</Button>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium">Sale: {foundSale.saleNumber}</p>
                <p className="text-sm text-gray-500">Total: {formatCurrency(foundSale.totalAmount)}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Select Items to Refund:</h4>
                {refundItems.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => {
                          const updated = [...refundItems];
                          updated[idx].selected = e.target.checked;
                          setRefundItems(updated);
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        {item.unitType === 'quantity' ? (
                          <div className="mt-2">
                            <label className="text-sm text-gray-500">Quantity to refund (max: {item.quantity || 0})</label>
                            <Input
                              type="number"
                              min="0"
                              max={item.quantity || 0}
                              value={item.refundQuantity}
                              onChange={(e) => {
                                const updated = [...refundItems];
                                updated[idx].refundQuantity = parseInt(e.target.value) || 0;
                                setRefundItems(updated);
                              }}
                              disabled={!item.selected}
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <Input
                              label={`Bags (max: ${item.quantityBags || 0})`}
                              type="number"
                              min="0"
                              max={item.quantityBags || 0}
                              value={item.refundQuantityBags}
                              onChange={(e) => {
                                const updated = [...refundItems];
                                updated[idx].refundQuantityBags = parseInt(e.target.value) || 0;
                                setRefundItems(updated);
                              }}
                              disabled={!item.selected}
                            />
                            <Input
                              label={`1/2 Bags (max: ${item.quantityHalfBags || 0})`}
                              type="number"
                              min="0"
                              max={item.quantityHalfBags || 0}
                              value={item.refundQuantityHalfBags}
                              onChange={(e) => {
                                const updated = [...refundItems];
                                updated[idx].refundQuantityHalfBags = parseInt(e.target.value) || 0;
                                setRefundItems(updated);
                              }}
                              disabled={!item.selected}
                            />
                            <Input
                              label={`1/4 Bags (max: ${item.quantityQuarterBags || 0})`}
                              type="number"
                              min="0"
                              max={item.quantityQuarterBags || 0}
                              value={item.refundQuantityQuarterBags}
                              onChange={(e) => {
                                const updated = [...refundItems];
                                updated[idx].refundQuantityQuarterBags = parseInt(e.target.value) || 0;
                                setRefundItems(updated);
                              }}
                              disabled={!item.selected}
                            />
                            <Input
                              label={`Paints (max: ${item.quantityPaints || 0})`}
                              type="number"
                              min="0"
                              max={item.quantityPaints || 0}
                              value={item.refundQuantityPaints}
                              onChange={(e) => {
                                const updated = [...refundItems];
                                updated[idx].refundQuantityPaints = parseInt(e.target.value) || 0;
                                setRefundItems(updated);
                              }}
                              disabled={!item.selected}
                            />
                            <Input
                              label={`1/2 Paints (max: ${item.quantityHalfPaints || 0})`}
                              type="number"
                              min="0"
                              max={item.quantityHalfPaints || 0}
                              value={item.refundQuantityHalfPaints}
                              onChange={(e) => {
                                const updated = [...refundItems];
                                updated[idx].refundQuantityHalfPaints = parseInt(e.target.value) || 0;
                                setRefundItems(updated);
                              }}
                              disabled={!item.selected}
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <Input
                label="Reason for Refund"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                required
              />

              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => { setIsNewRefundOpen(false); resetRefundForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleRefundSubmit} loading={processing}>
                  Submit Refund Request
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Refund Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setRejectionReason(''); }}
        title={`Refund Details - ${selectedRefund?.refundNumber}`}
        size="lg"
      >
        {selectedRefund && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Original Sale</p>
                <p className="font-medium">{selectedRefund.saleNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                {getStatusBadge(selectedRefund.status)}
              </div>
              <div>
                <p className="text-gray-500">Requested By</p>
                <p className="font-medium">
                  {selectedRefund.requestedBy?.firstName} {selectedRefund.requestedBy?.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{formatDateTime(selectedRefund.createdAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Reason</p>
              <p className="font-medium">{selectedRefund.reason}</p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Items</h4>
              {selectedRefund.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded mb-2">
                  <span>{item.productName}</span>
                  <span className="text-red-600">{formatCurrency(item.refundAmount)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-lg font-semibold">Total Refund</span>
              <span className="text-xl font-bold text-red-600">
                {formatCurrency(selectedRefund.totalRefundAmount)}
              </span>
            </div>

            {isAdmin() && selectedRefund.status === 'pending' && (
              <div className="border-t pt-4 space-y-3">
                <Input
                  label="Rejection Reason (if rejecting)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div className="flex space-x-3">
                  <Button
                    variant="danger"
                    onClick={() => handleReject(selectedRefund._id)}
                    className="flex-1"
                  >
                    <XMarkIcon className="h-5 w-5 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleApprove(selectedRefund._id)}
                    className="flex-1"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RefundList;
