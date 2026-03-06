import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { treatmentAPI, clientAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { TREATMENT_TYPES, TREATMENT_STATUS } from '../../utils/constants';
import { formatDateTime, formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const TreatmentList = () => {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    treatmentType: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  // Client search
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchingClients, setSearchingClients] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    client: '',
    petName: '',
    treatmentType: '',
    description: '',
    cost: '',
    treatmentDate: new Date().toISOString().split('T')[0],
    nextAppointment: '',
    veterinarian: '',
    notes: '',
    status: 'completed',
  });

  useEffect(() => {
    fetchTreatments();
    fetchStats();
  }, [filters]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (clientSearch.length >= 2) {
        searchClients();
      } else {
        setClientResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [clientSearch]);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.treatmentType) params.treatmentType = filters.treatmentType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search) params.search = filters.search;

      const response = await treatmentAPI.getAll(params);
      setTreatments(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch treatments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await treatmentAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const searchClients = async () => {
    try {
      setSearchingClients(true);
      const response = await clientAPI.search(clientSearch);
      setClientResults(response.data.data);
    } catch (error) {
      setClientResults([]);
    } finally {
      setSearchingClients(false);
    }
  };

  const selectClient = (client) => {
    setSelectedClient(client);
    setFormData({ ...formData, client: client._id, petName: '' });
    setClientSearch('');
    setClientResults([]);
  };

  const resetForm = () => {
    setFormData({
      client: '',
      petName: '',
      treatmentType: '',
      description: '',
      cost: '',
      treatmentDate: new Date().toISOString().split('T')[0],
      nextAppointment: '',
      veterinarian: '',
      notes: '',
      status: 'completed',
    });
    setSelectedClient(null);
    setSelectedTreatment(null);
    setClientSearch('');
    setClientResults([]);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (treatment) => {
    setSelectedTreatment(treatment);
    setSelectedClient(treatment.client);
    setFormData({
      client: treatment.client?._id,
      petName: treatment.petName || '',
      treatmentType: treatment.treatmentType,
      description: treatment.description || '',
      cost: treatment.cost.toString(),
      treatmentDate: treatment.treatmentDate
        ? new Date(treatment.treatmentDate).toISOString().split('T')[0]
        : '',
      nextAppointment: treatment.nextAppointment
        ? new Date(treatment.nextAppointment).toISOString().split('T')[0]
        : '',
      veterinarian: treatment.veterinarian || '',
      notes: treatment.notes || '',
      status: treatment.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client) {
      toast.error('Please select a client');
      return;
    }
    if (!formData.treatmentType) {
      toast.error('Please select a treatment type');
      return;
    }
    if (!formData.cost) {
      toast.error('Please enter a cost');
      return;
    }

    setProcessing(true);

    try {
      const data = {
        ...formData,
        cost: parseFloat(formData.cost),
      };

      if (selectedTreatment) {
        await treatmentAPI.update(selectedTreatment._id, data);
        toast.success('Treatment updated successfully');
      } else {
        await treatmentAPI.create(data);
        toast.success('Treatment recorded successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchTreatments();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this treatment?')) return;

    try {
      await treatmentAPI.cancel(id);
      toast.success('Treatment cancelled');
      fetchTreatments();
      fetchStats();
    } catch (error) {
      toast.error('Failed to cancel treatment');
    }
  };

  const getTreatmentBadge = (type) => {
    const variants = {
      vaccination: 'success',
      deworming: 'warning',
      treatment: 'info',
    };
    return (
      <Badge variant={variants[type] || 'default'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const info = TREATMENT_STATUS[status] || { label: status, color: 'default' };
    return <Badge variant={info.color}>{info.label}</Badge>;
  };

  const columns = [
    {
      key: 'treatmentNumber',
      title: 'Treatment #',
      render: (val) => <span className="font-mono text-sm">{val}</span>,
    },
    {
      key: 'treatmentDate',
      title: 'Date',
      render: (date) => formatDate(date),
    },
    {
      key: 'client',
      title: 'Client',
      render: (client) => (
        <div>
          <p className="font-medium">
            {client?.firstName} {client?.lastName}
          </p>
          <p className="text-xs text-gray-500">{client?.phone}</p>
        </div>
      ),
    },
    {
      key: 'petName',
      title: 'Pet',
      render: (val) => val || '-',
    },
    {
      key: 'treatmentType',
      title: 'Type',
      render: (type) => getTreatmentBadge(type),
    },
    {
      key: 'cost',
      title: 'Cost',
      render: (cost) => formatCurrency(cost),
    },
    {
      key: 'veterinarian',
      title: 'Vet',
      render: (val) => val || '-',
    },
    {
      key: 'status',
      title: 'Status',
      render: (status) => getStatusBadge(status),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-1 text-primary-600 hover:bg-primary-50 rounded"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {row.status !== 'cancelled' && (
            <button
              onClick={() => handleCancel(row._id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Cancel"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Treatments</h1>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => navigate('/clients')}>
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Manage Clients
          </Button>
          <Button onClick={openCreateModal}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Treatment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Vaccinations</p>
            <p className="text-2xl font-bold text-green-700">{stats.totalVaccinations}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-600">Dewormings</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.totalDewormings}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Treatments</p>
            <p className="text-2xl font-bold text-blue-700">{stats.totalTreatments}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">Today's Revenue</p>
            <p className="text-2xl font-bold text-purple-700">
              {formatCurrency(stats.todayRevenue)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search client..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            placeholder="All Types"
            options={TREATMENT_TYPES}
            value={filters.treatmentType}
            onChange={(e) => setFilters({ ...filters, treatmentType: e.target.value })}
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

      {/* Treatments Table */}
      <Card>
        <Table
          columns={columns}
          data={treatments}
          loading={loading}
          emptyMessage="No treatments found"
        />
      </Card>

      {/* Create/Edit Treatment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedTreatment ? 'Edit Treatment' : 'Record Treatment'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            {selectedClient ? (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                <div>
                  <p className="font-medium">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedClient.phone}</p>
                </div>
                {!selectedTreatment && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient(null);
                      setFormData({ ...formData, client: '', petName: '' });
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Search by name or phone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
                />
                {clientResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {clientResults.map((client) => (
                      <button
                        key={client._id}
                        type="button"
                        onClick={() => selectClient(client)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50"
                      >
                        <p className="font-medium">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {client.phone} - {client.pets?.length || 0} pet(s)
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {searchingClients && (
                  <p className="text-sm text-gray-500 mt-1">Searching...</p>
                )}
              </div>
            )}
          </div>

          {/* Pet Selection */}
          {selectedClient && selectedClient.pets?.length > 0 && (
            <Select
              label="Pet"
              options={selectedClient.pets.map((p) => ({ value: p.name, label: p.name }))}
              value={formData.petName}
              onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
              placeholder="Select pet..."
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Treatment Type"
              options={TREATMENT_TYPES}
              value={formData.treatmentType}
              onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
              required
            />
            <Input
              label="Cost"
              type="number"
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              required
            />
          </div>

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What was done..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Treatment Date"
              type="date"
              value={formData.treatmentDate}
              onChange={(e) => setFormData({ ...formData, treatmentDate: e.target.value })}
              required
            />
            <Input
              label="Next Appointment"
              type="date"
              value={formData.nextAppointment}
              onChange={(e) => setFormData({ ...formData, nextAppointment: e.target.value })}
            />
          </div>

          <Input
            label="Veterinarian"
            value={formData.veterinarian}
            onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
            placeholder="Name of vet who performed treatment"
          />

          <Input
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
          />

          {selectedTreatment && (
            <Select
              label="Status"
              options={[
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth loading={processing}>
              {selectedTreatment ? 'Update Treatment' : 'Record Treatment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TreatmentList;
