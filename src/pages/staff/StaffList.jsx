import { useState, useEffect } from 'react';
import { staffAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { DEPARTMENTS, ROLES } from '../../utils/constants';
import { formatDate, getRoleBadgeColor, getDepartmentBadgeColor } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    department: '',
  });
  const [transferDepartment, setTransferDepartment] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    role: '',
    search: '',
  });

  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    fetchStaff();
  }, [filters]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getAll(filters);
      setStaff(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedStaff) {
        const { password, ...updateData } = formData;
        await staffAPI.update(selectedStaff._id, updateData);
        toast.success('Staff updated successfully');
      } else {
        await staffAPI.create(formData);
        toast.success('Staff created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleTransfer = async () => {
    try {
      await staffAPI.transfer(selectedStaff._id, { department: transferDepartment });
      toast.success('Staff transferred successfully');
      setIsTransferModalOpen(false);
      setSelectedStaff(null);
      setTransferDepartment('');
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this staff member?')) return;
    try {
      await staffAPI.deactivate(id);
      toast.success('Staff deactivated');
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleReactivate = async (id) => {
    try {
      await staffAPI.reactivate(id);
      toast.success('Staff reactivated');
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const openEditModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      password: '',
      role: staffMember.role,
      department: staffMember.department,
    });
    setIsModalOpen(true);
  };

  const openTransferModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setTransferDepartment(staffMember.department === 'feeds' ? 'store' : 'feeds');
    setIsTransferModalOpen(true);
  };

  const resetForm = () => {
    setSelectedStaff(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: '',
      department: '',
    });
  };

  const availableRoles = isSuperAdmin()
    ? ROLES.filter(r => r.value !== 'super_admin')
    : ROLES.filter(r => r.value === 'sales_rep');

  const columns = [
    {
      key: 'name',
      title: 'Name',
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.firstName} {row.lastName}</p>
          <p className="text-sm text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      render: (role) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(role)}`}>
          {role.replace('_', ' ')}
        </span>
      ),
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
      key: 'isActive',
      title: 'Status',
      render: (isActive) => (
        <Badge variant={isActive ? 'success' : 'danger'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      title: 'Joined',
      render: (date) => formatDate(date),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditModal(row)}
            className="text-primary-600 hover:text-primary-900"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => openTransferModal(row)}
            className="text-blue-600 hover:text-blue-900"
            title="Transfer"
          >
            <ArrowsRightLeftIcon className="h-5 w-5" />
          </button>
          {row.isActive ? (
            <button
              onClick={() => handleDeactivate(row._id)}
              className="text-red-600 hover:text-red-900 text-sm"
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={() => handleReactivate(row._id)}
              className="text-green-600 hover:text-green-900 text-sm"
            >
              Activate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Staff Management</h1>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search by name or email"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            placeholder="All Departments"
            options={DEPARTMENTS}
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          />
          <Select
            placeholder="All Roles"
            options={availableRoles}
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          />
        </div>
      </Card>

      {/* Staff Table */}
      <Card>
        <Table
          columns={columns}
          data={staff}
          loading={loading}
          emptyMessage="No staff members found"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={selectedStaff ? 'Edit Staff' : 'Add Staff'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          {!selectedStaff && (
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          )}
          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={availableRoles}
            required
          />
          <Select
            label="Department"
            name="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            options={DEPARTMENTS}
            required
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedStaff ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => { setIsTransferModalOpen(false); setSelectedStaff(null); }}
        title="Transfer Staff"
        size="sm"
      >
        <div className="space-y-4">
          <p>
            Transfer <strong>{selectedStaff?.firstName} {selectedStaff?.lastName}</strong> to:
          </p>
          <Select
            label="New Department"
            value={transferDepartment}
            onChange={(e) => setTransferDepartment(e.target.value)}
            options={DEPARTMENTS}
            required
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransfer}>
              Transfer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffList;
