import { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { DEPARTMENTS } from '../../utils/constants';
import { formatCurrency, getDepartmentBadgeColor } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    search: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    unitType: '',
    pricePerBag: '',
    pricePerHalfBag: '',
    pricePerThirdBag: '',
    pricePerPaint: '',
    pricePerHalfPaint: '',
    pricePerUnit: '',
    stockBags: '',
    stockInQuantity: '',
    lowStockThreshold: '10',
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll(filters);
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (e) => {
    const department = e.target.value;
    setFormData({
      ...formData,
      department,
      unitType: department === 'feeds' ? 'bag' : 'quantity',
    });
  };

  // Convert bags to paints for storage (8 paints = 1 bag)
  const bagsToTotalPaints = () => {
    const bags = parseInt(formData.stockBags) || 0;
    return bags * 8;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        pricePerBag: formData.pricePerBag ? parseFloat(formData.pricePerBag) : undefined,
        pricePerHalfBag: formData.pricePerHalfBag ? parseFloat(formData.pricePerHalfBag) : undefined,
        pricePerThirdBag: formData.pricePerThirdBag ? parseFloat(formData.pricePerThirdBag) : undefined,
        pricePerPaint: formData.pricePerPaint ? parseFloat(formData.pricePerPaint) : undefined,
        pricePerHalfPaint: formData.pricePerHalfPaint ? parseFloat(formData.pricePerHalfPaint) : undefined,
        pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : undefined,
        stockInPaints: bagsToTotalPaints(),
        stockInQuantity: formData.stockInQuantity ? parseInt(formData.stockInQuantity) : 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
      };
      // Remove the bags field before sending (we convert to paints)
      delete data.stockBags;

      if (selectedProduct) {
        await productAPI.update(selectedProduct._id, data);
        toast.success('Product updated successfully');
      } else {
        await productAPI.create(data);
        toast.success('Product created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await productAPI.deactivate(id);
      toast.success('Product deactivated');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleReactivate = async (id) => {
    try {
      await productAPI.reactivate(id);
      toast.success('Product reactivated');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      department: product.department,
      unitType: product.unitType,
      pricePerBag: product.pricePerBag?.toString() || '',
      pricePerHalfBag: product.pricePerHalfBag?.toString() || '',
      pricePerThirdBag: product.pricePerThirdBag?.toString() || '',
      pricePerPaint: product.pricePerPaint?.toString() || '',
      pricePerHalfPaint: product.pricePerHalfPaint?.toString() || '',
      pricePerUnit: product.pricePerUnit?.toString() || '',
      stockBags: '',
      stockInQuantity: '',
      lowStockThreshold: product.lowStockThreshold?.toString() || '10',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      description: '',
      department: '',
      unitType: '',
      pricePerBag: '',
      pricePerHalfBag: '',
      pricePerThirdBag: '',
      pricePerPaint: '',
      pricePerHalfPaint: '',
      pricePerUnit: '',
      stockBags: '',
      stockInQuantity: '',
      lowStockThreshold: '10',
    });
  };

  const columns = [
    {
      key: 'name',
      title: 'Product',
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          {row.description && (
            <p className="text-sm text-gray-500">{row.description}</p>
          )}
        </div>
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
      key: 'price',
      title: 'Price',
      render: (_, row) => (
        <div className="text-sm">
          {row.unitType === 'bag' ? (
            <>
              {row.pricePerBag && <p>Bag: {formatCurrency(row.pricePerBag)}</p>}
              {row.pricePerPaint && <p>Paint: {formatCurrency(row.pricePerPaint)}</p>}
            </>
          ) : (
            <p>Unit: {formatCurrency(row.pricePerUnit)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      title: 'Stock',
      render: (_, row) => (
        <div>
          <p className={row.isLowStock ? 'text-red-600 font-medium' : ''}>
            {row.stockDisplay}
          </p>
          {row.isLowStock && (
            <Badge variant="danger" size="sm">Low Stock</Badge>
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
  ];

  if (isAdmin()) {
    columns.push({
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditModal(row)}
            className="text-primary-600 hover:text-primary-900"
          >
            <PencilIcon className="h-5 w-5" />
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
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        {isAdmin() && (
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search products"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            placeholder="All Departments"
            options={DEPARTMENTS}
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          />
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <Table
          columns={columns}
          data={products}
          loading={loading}
          emptyMessage="No products found"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={selectedProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Product Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          {!selectedProduct && (
            <Select
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleDepartmentChange}
              options={DEPARTMENTS}
              required
            />
          )}

          {formData.unitType === 'bag' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Pricing (Feeds)</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Price per Bag"
                  name="pricePerBag"
                  type="number"
                  step="0.01"
                  value={formData.pricePerBag}
                  onChange={(e) => setFormData({ ...formData, pricePerBag: e.target.value })}
                />
                <Input
                  label="Price per 1/2 Bag"
                  name="pricePerHalfBag"
                  type="number"
                  step="0.01"
                  value={formData.pricePerHalfBag}
                  onChange={(e) => setFormData({ ...formData, pricePerHalfBag: e.target.value })}
                />
                <Input
                  label="Price per 1/3 Bag"
                  name="pricePerThirdBag"
                  type="number"
                  step="0.01"
                  value={formData.pricePerThirdBag}
                  onChange={(e) => setFormData({ ...formData, pricePerThirdBag: e.target.value })}
                />
                <Input
                  label="Price per Paint"
                  name="pricePerPaint"
                  type="number"
                  step="0.01"
                  value={formData.pricePerPaint}
                  onChange={(e) => setFormData({ ...formData, pricePerPaint: e.target.value })}
                />
                <Input
                  label="Price per 1/2 Paint"
                  name="pricePerHalfPaint"
                  type="number"
                  step="0.01"
                  value={formData.pricePerHalfPaint}
                  onChange={(e) => setFormData({ ...formData, pricePerHalfPaint: e.target.value })}
                />
              </div>
              {!selectedProduct && (
                <Input
                  label="Initial Stock (Bags)"
                  name="stockBags"
                  type="number"
                  min="0"
                  value={formData.stockBags}
                  onChange={(e) => setFormData({ ...formData, stockBags: e.target.value })}
                  placeholder="e.g., 10"
                />
              )}
            </div>
          )}

          {formData.unitType === 'quantity' && (
            <div className="space-y-4">
              <Input
                label="Price per Unit"
                name="pricePerUnit"
                type="number"
                step="0.01"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                required
              />
              {!selectedProduct && (
                <Input
                  label="Initial Stock (Quantity)"
                  name="stockInQuantity"
                  type="number"
                  value={formData.stockInQuantity}
                  onChange={(e) => setFormData({ ...formData, stockInQuantity: e.target.value })}
                />
              )}
            </div>
          )}

          <Input
            label="Low Stock Threshold"
            name="lowStockThreshold"
            type="number"
            value={formData.lowStockThreshold}
            onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedProduct ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductList;
