import { useState, useEffect } from 'react';
import { clientAPI, treatmentAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { PET_TYPES } from '../../utils/constants';
import { formatDateTime, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientTreatments, setClientTreatments] = useState([]);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    pets: [],
  });

  const [newPet, setNewPet] = useState({
    name: '',
    type: '',
    breed: '',
    age: '',
    notes: '',
  });

  useEffect(() => {
    fetchClients();
  }, [search]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = search ? { search } : {};
      const response = await clientAPI.getAll(params);
      setClients(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      pets: [],
    });
    setNewPet({
      name: '',
      type: '',
      breed: '',
      age: '',
      notes: '',
    });
    setSelectedClient(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email || '',
      address: client.address || '',
      pets: client.pets || [],
    });
    setIsModalOpen(true);
  };

  const openViewModal = async (client) => {
    setSelectedClient(client);
    try {
      const response = await treatmentAPI.getByClient(client._id);
      setClientTreatments(response.data.data);
    } catch (error) {
      setClientTreatments([]);
    }
    setIsViewModalOpen(true);
  };

  const handleAddPet = () => {
    if (!newPet.name.trim()) {
      toast.error('Pet name is required');
      return;
    }
    setFormData({
      ...formData,
      pets: [...formData.pets, { ...newPet }],
    });
    setNewPet({
      name: '',
      type: '',
      breed: '',
      age: '',
      notes: '',
    });
  };

  const handleRemovePet = (index) => {
    const updatedPets = formData.pets.filter((_, i) => i !== index);
    setFormData({ ...formData, pets: updatedPets });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      if (selectedClient) {
        await clientAPI.update(selectedClient._id, formData);
        toast.success('Client updated successfully');
      } else {
        await clientAPI.create(formData);
        toast.success('Client created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this client?')) return;

    try {
      await clientAPI.deactivate(id);
      toast.success('Client deactivated');
      fetchClients();
    } catch (error) {
      toast.error('Failed to deactivate client');
    }
  };

  const handleReactivate = async (id) => {
    try {
      await clientAPI.reactivate(id);
      toast.success('Client reactivated');
      fetchClients();
    } catch (error) {
      toast.error('Failed to reactivate client');
    }
  };

  const columns = [
    {
      key: 'clientNumber',
      title: 'Client #',
      render: (val) => <span className="font-mono text-sm">{val}</span>,
    },
    {
      key: 'fullName',
      title: 'Name',
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.firstName} {row.lastName}</p>
          <p className="text-xs text-gray-500">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      render: (val) => val || '-',
    },
    {
      key: 'pets',
      title: 'Pets',
      render: (pets) => (
        <div className="flex flex-wrap gap-1">
          {pets?.length > 0 ? (
            pets.slice(0, 3).map((pet, i) => (
              <Badge key={i} variant="info" size="sm">
                {pet.name}
              </Badge>
            ))
          ) : (
            <span className="text-gray-400">No pets</span>
          )}
          {pets?.length > 3 && (
            <Badge variant="default" size="sm">+{pets.length - 3}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (isActive) => (
        <Badge variant={isActive ? 'success' : 'danger'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openViewModal(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="p-1 text-primary-600 hover:bg-primary-50 rounded"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {row.isActive ? (
            <button
              onClick={() => handleDeactivate(row._id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Deactivate"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => handleReactivate(row._id)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Reactivate"
            >
              <UserPlusIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
        <Button onClick={openCreateModal}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <Card>
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Clients Table */}
      <Card>
        <Table
          columns={columns}
          data={clients}
          loading={loading}
          emptyMessage="No clients found"
        />
      </Card>

      {/* Create/Edit Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedClient ? 'Edit Client' : 'Add New Client'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          {/* Pets Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-3">Pets</h3>

            {/* Existing Pets */}
            {formData.pets.length > 0 && (
              <div className="space-y-2 mb-4">
                {formData.pets.map((pet, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div>
                      <span className="font-medium">{pet.name}</span>
                      {pet.type && <span className="text-gray-500 ml-2">({pet.type})</span>}
                      {pet.breed && <span className="text-gray-400 ml-1">- {pet.breed}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePet(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Pet */}
            <div className="bg-gray-50 p-3 rounded space-y-3">
              <p className="text-sm text-gray-600">Add a pet:</p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Pet Name"
                  value={newPet.name}
                  onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                />
                <Select
                  placeholder="Pet Type"
                  options={PET_TYPES}
                  value={newPet.type}
                  onChange={(e) => setNewPet({ ...newPet, type: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Breed (optional)"
                  value={newPet.breed}
                  onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                />
                <Input
                  placeholder="Age (optional)"
                  value={newPet.age}
                  onChange={(e) => setNewPet({ ...newPet, age: e.target.value })}
                />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddPet}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Pet
              </Button>
            </div>
          </div>

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
              {selectedClient ? 'Update Client' : 'Create Client'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Client Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedClient(null);
          setClientTreatments([]);
        }}
        title={`Client Details - ${selectedClient?.firstName} ${selectedClient?.lastName}`}
        size="lg"
      >
        {selectedClient && (
          <div className="space-y-4">
            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Client Number</p>
                <p className="font-mono">{selectedClient.clientNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p>{selectedClient.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p>{selectedClient.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p>{selectedClient.address || '-'}</p>
              </div>
            </div>

            {/* Pets */}
            <div>
              <h4 className="font-medium mb-2">Pets ({selectedClient.pets?.length || 0})</h4>
              {selectedClient.pets?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {selectedClient.pets.map((pet, i) => (
                    <div key={i} className="bg-blue-50 p-2 rounded">
                      <p className="font-medium">{pet.name}</p>
                      <p className="text-sm text-gray-600">
                        {pet.type && <span>{pet.type}</span>}
                        {pet.breed && <span> - {pet.breed}</span>}
                        {pet.age && <span> ({pet.age})</span>}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No pets registered</p>
              )}
            </div>

            {/* Treatment History */}
            <div>
              <h4 className="font-medium mb-2">Recent Treatments</h4>
              {clientTreatments.length > 0 ? (
                <div className="max-h-48 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-header">Date</th>
                        <th className="table-header">Type</th>
                        <th className="table-header">Pet</th>
                        <th className="table-header">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clientTreatments.map((t) => (
                        <tr key={t._id}>
                          <td className="table-cell">{formatDateTime(t.treatmentDate)}</td>
                          <td className="table-cell">
                            <Badge
                              variant={
                                t.treatmentType === 'vaccination'
                                  ? 'success'
                                  : t.treatmentType === 'deworming'
                                  ? 'warning'
                                  : 'info'
                              }
                            >
                              {t.treatmentType}
                            </Badge>
                          </td>
                          <td className="table-cell">{t.petName || '-'}</td>
                          <td className="table-cell">{formatCurrency(t.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No treatment history</p>
              )}
            </div>

            <div className="pt-4">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedClient(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientList;
