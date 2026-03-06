import { useState, useEffect } from 'react';
import { salesAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { DISCOUNT_REQUEST_STATUS } from '../../utils/constants';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { CheckIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';

const DiscountRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getDiscountRequests({ status: statusFilter });
      setRequests(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch discount requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessing(true);
    try {
      await salesAPI.approveDiscount(id);
      toast.success('Discount approved and sale created');
      fetchRequests();
      setIsDetailOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve discount');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await salesAPI.rejectDiscount(selectedRequest._id, { rejectionReason });
      toast.success('Discount request rejected');
      fetchRequests();
      setIsRejectOpen(false);
      setIsDetailOpen(false);
      setRejectionReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject discount');
    } finally {
      setProcessing(false);
    }
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setIsRejectOpen(true);
  };

  const getStatusBadge = (status) => {
    const info = DISCOUNT_REQUEST_STATUS[status] || { label: status, color: 'default' };
    return <Badge variant={info.color}>{info.label}</Badge>;
  };

  const columns = [
    {
      key: 'requestedBy',
      title: 'Requested By',
      render: (user) => user ? `${user.firstName} ${user.lastName}` : 'N/A',
    },
    {
      key: 'totalBags',
      title: 'Total Bags',
    },
    {
      key: 'subtotalAmount',
      title: 'Subtotal',
      render: (amount) => formatCurrency(amount),
    },
    {
      key: 'discountAmount',
      title: 'Discount',
      render: (amount) => (
        <span className="text-green-600 font-medium">
          -{formatCurrency(amount)}
        </span>
      ),
    },
    {
      key: 'finalAmount',
      title: 'Final Amount',
      render: (amount) => formatCurrency(amount),
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
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => viewDetails(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => handleApprove(row._id)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Approve"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => openRejectModal(row)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Reject"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Discount Requests</h1>

      {/* Filter */}
      <Card>
        <div className="flex space-x-2">
          {['pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Requests Table */}
      <Card>
        <Table
          columns={columns}
          data={requests}
          loading={loading}
          emptyMessage="No discount requests found"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Discount Request Details"
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Requested By</p>
                <p className="font-medium">
                  {selectedRequest.requestedBy?.firstName} {selectedRequest.requestedBy?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                {getStatusBadge(selectedRequest.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Bags</p>
                <p className="font-medium">{selectedRequest.totalBags}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDateTime(selectedRequest.createdAt)}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedRequest.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount Requested:</span>
                <span>-{formatCurrency(selectedRequest.discountAmount)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Final Amount:</span>
                <span>{formatCurrency(selectedRequest.finalAmount)}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Reason for Discount</p>
              <p className="bg-yellow-50 rounded p-3 text-sm">{selectedRequest.discountReason}</p>
            </div>

            {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
              <div>
                <p className="text-sm text-gray-500">Rejection Reason</p>
                <p className="bg-red-50 text-red-700 rounded p-3 text-sm">
                  {selectedRequest.rejectionReason}
                </p>
              </div>
            )}

            {selectedRequest.processedBy && (
              <div>
                <p className="text-sm text-gray-500">Processed By</p>
                <p className="font-medium">
                  {selectedRequest.processedBy?.firstName} {selectedRequest.processedBy?.lastName}
                </p>
              </div>
            )}

            {/* Items Preview */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Items in Sale</p>
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                {selectedRequest.pendingSaleData?.items?.map((item, idx) => (
                  <div key={idx} className="text-sm py-1 border-b last:border-b-0">
                    Product ID: {item.productId}
                    {item.quantityBags > 0 && ` - ${item.quantityBags} bags`}
                    {item.quantity > 0 && ` - ${item.quantity} units`}
                  </div>
                ))}
              </div>
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    setIsDetailOpen(false);
                    openRejectModal(selectedRequest);
                  }}
                >
                  Reject
                </Button>
                <Button
                  fullWidth
                  onClick={() => handleApprove(selectedRequest._id)}
                  loading={processing}
                >
                  Approve & Create Sale
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => {
          setIsRejectOpen(false);
          setRejectionReason('');
        }}
        title="Reject Discount Request"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please provide a reason for rejecting this discount request.
          </p>

          <Input
            label="Rejection Reason"
            placeholder="Enter reason for rejection"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />

          <div className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setIsRejectOpen(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleReject}
              loading={processing}
            >
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DiscountRequests;
