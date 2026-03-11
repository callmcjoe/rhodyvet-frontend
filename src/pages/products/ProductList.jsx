import { useState, useEffect } from 'react';
import { productAPI, stockAPI } from '../../services/api';
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
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
    baseUnit: '',
    stockUnit: '',
    stockUnitEquivalent: '',
    initialStockInStockUnits: '',
  });
  const [saleUnits, setSaleUnits] = useState([{ name: '', price: '', equivalent: '' }]);
  const [duplicateModal, setDuplicateModal] = useState({ isOpen: false, product: null });
  const [stockToAdd, setStockToAdd] = useState({
    quantityInBags: '',
    quantityInStockUnits: '',
    quantity: '',
    notes: ''
  });
  const [addingStock, setAddingStock] = useState(false);

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
      const stockInPaintsValue = bagsToTotalPaints();

      const data = {
        ...formData,
        pricePerBag: formData.pricePerBag ? parseFloat(formData.pricePerBag) : undefined,
        pricePerHalfBag: formData.pricePerHalfBag ? parseFloat(formData.pricePerHalfBag) : undefined,
        pricePerThirdBag: formData.pricePerThirdBag ? parseFloat(formData.pricePerThirdBag) : undefined,
        pricePerPaint: formData.pricePerPaint ? parseFloat(formData.pricePerPaint) : undefined,
        pricePerHalfPaint: formData.pricePerHalfPaint ? parseFloat(formData.pricePerHalfPaint) : undefined,
        pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : undefined,
        stockInPaints: stockInPaintsValue,
        stockInQuantity: formData.stockInQuantity ? parseFloat(formData.stockInQuantity) : 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
      };
      // Remove the bags field before sending (we convert to paints)
      delete data.stockBags;

      // For store products, add baseUnit, stockUnit, and saleUnits
      if (formData.unitType === 'quantity') {
        data.baseUnit = formData.baseUnit;
        data.stockUnit = formData.stockUnit;
        data.stockUnitEquivalent = formData.stockUnitEquivalent ? parseFloat(formData.stockUnitEquivalent) : undefined;
        data.initialStockInStockUnits = formData.initialStockInStockUnits ? parseFloat(formData.initialStockInStockUnits) : undefined;
        data.saleUnits = saleUnits
          .filter(u => u.name && u.price && u.equivalent)
          .map(u => ({
            name: u.name,
            price: parseFloat(u.price),
            equivalent: parseFloat(u.equivalent)
          }));
      }

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
      if (error.response?.data?.code === 'DUPLICATE_PRODUCT') {
        setIsModalOpen(false);
        setDuplicateModal({
          isOpen: true,
          product: error.response.data.existingProduct
        });
        setStockToAdd({ bags: '', quantity: '' });
      } else {
        toast.error(error.response?.data?.message || 'Operation failed');
      }
    }
  };

  const handleAddStockToExisting = async () => {
    const product = duplicateModal.product;
    if (!product) return;

    setAddingStock(true);
    try {
      const data = {
        notes: stockToAdd.notes || 'Stock added during product creation'
      };

      if (product.unitType === 'bag') {
        // Feeds products - use bags
        const bags = parseFloat(stockToAdd.quantityInBags) || 0;
        if (bags <= 0) {
          toast.error('Please enter a valid number of bags');
          setAddingStock(false);
          return;
        }
        data.quantityInBags = bags;
      } else if (product.stockUnit && product.stockUnitEquivalent) {
        // Store products with stock unit conversion
        const stockUnits = parseFloat(stockToAdd.quantityInStockUnits) || 0;
        if (stockUnits <= 0) {
          toast.error(`Please enter a valid number of ${product.stockUnit}s`);
          setAddingStock(false);
          return;
        }
        data.quantity = stockUnits * product.stockUnitEquivalent;
      } else {
        // Legacy store products without stock unit
        const qty = parseFloat(stockToAdd.quantity) || 0;
        if (qty <= 0) {
          toast.error('Please enter a valid quantity');
          setAddingStock(false);
          return;
        }
        data.quantity = qty;
      }

      await stockAPI.addStock(product._id, data);
      toast.success(`Stock added to "${product.name}" successfully`);
      setDuplicateModal({ isOpen: false, product: null });
      setStockToAdd({ quantityInBags: '', quantityInStockUnits: '', quantity: '', notes: '' });
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add stock');
    } finally {
      setAddingStock(false);
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
      baseUnit: product.baseUnit || '',
      stockUnit: product.stockUnit || '',
      stockUnitEquivalent: product.stockUnitEquivalent?.toString() || '',
      initialStockInStockUnits: '',
    });
    // Load existing sale units for store products
    if (product.saleUnits && product.saleUnits.length > 0) {
      setSaleUnits(product.saleUnits.map(u => ({
        name: u.name,
        price: u.price?.toString() || '',
        equivalent: u.equivalent?.toString() || ''
      })));
    } else {
      setSaleUnits([{ name: '', price: '', equivalent: '' }]);
    }
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
      baseUnit: '',
      stockUnit: '',
      stockUnitEquivalent: '',
      initialStockInStockUnits: '',
    });
    setSaleUnits([{ name: '', price: '', equivalent: '' }]);
  };

  const addSaleUnit = () => {
    setSaleUnits([...saleUnits, { name: '', price: '', equivalent: '' }]);
  };

  const removeSaleUnit = (index) => {
    if (saleUnits.length > 1) {
      setSaleUnits(saleUnits.filter((_, i) => i !== index));
    }
  };

  const updateSaleUnit = (index, field, value) => {
    const updated = [...saleUnits];
    updated[index][field] = value;
    setSaleUnits(updated);
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
          ) : row.saleUnits && row.saleUnits.length > 0 ? (
            <>
              {row.saleUnits.slice(0, 2).map((u, i) => (
                <p key={i}>{u.name}: {formatCurrency(u.price)}</p>
              ))}
              {row.saleUnits.length > 2 && <p className="text-gray-400">+{row.saleUnits.length - 2} more</p>}
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

      {/* Duplicate Product Modal */}
      <Modal
        isOpen={duplicateModal.isOpen}
        onClose={() => {
          setDuplicateModal({ isOpen: false, product: null });
          setStockToAdd({ quantityInBags: '', quantityInStockUnits: '', quantity: '', notes: '' });
        }}
        title={`Add Stock - ${duplicateModal.product?.name || ''}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              This product already exists. Add stock to the existing product instead.
            </p>
          </div>

          {duplicateModal.product && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Current Stock</p>
              <p className="font-semibold">{duplicateModal.product.stockDisplay}</p>
            </div>
          )}

          {duplicateModal.product?.unitType === 'bag' ? (
            <Input
              label="Bags to add"
              type="number"
              min="0"
              step="0.01"
              value={stockToAdd.quantityInBags}
              onChange={(e) => setStockToAdd({ ...stockToAdd, quantityInBags: e.target.value })}
              placeholder="e.g., 5"
            />
          ) : duplicateModal.product?.stockUnit && duplicateModal.product?.stockUnitEquivalent ? (
            <div>
              <Input
                label={`${duplicateModal.product.stockUnit}s to add`}
                type="number"
                min="0"
                step="0.01"
                value={stockToAdd.quantityInStockUnits}
                onChange={(e) => setStockToAdd({ ...stockToAdd, quantityInStockUnits: e.target.value })}
                placeholder={`e.g., 5 ${duplicateModal.product.stockUnit}s`}
              />
              {stockToAdd.quantityInStockUnits && (
                <p className="text-xs text-gray-500 mt-1">
                  = {(parseFloat(stockToAdd.quantityInStockUnits) || 0) * duplicateModal.product.stockUnitEquivalent} {duplicateModal.product.baseUnit}
                </p>
              )}
            </div>
          ) : (
            <Input
              label={`${duplicateModal.product?.baseUnit || 'Units'} to add`}
              type="number"
              min="0"
              step="0.01"
              value={stockToAdd.quantity}
              onChange={(e) => setStockToAdd({ ...stockToAdd, quantity: e.target.value })}
              placeholder="Enter quantity"
            />
          )}

          <Input
            label="Notes"
            value={stockToAdd.notes}
            onChange={(e) => setStockToAdd({ ...stockToAdd, notes: e.target.value })}
            placeholder="Reason for stock addition"
          />

          <div className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setDuplicateModal({ isOpen: false, product: null });
                setStockToAdd({ quantityInBags: '', quantityInStockUnits: '', quantity: '', notes: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleAddStockToExisting}
              loading={addingStock}
            >
              Add Stock
            </Button>
          </div>
        </div>
      </Modal>

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
              <p className="text-sm font-medium text-gray-700">Stock Configuration</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Base Unit (smallest unit for calculations)"
                  name="baseUnit"
                  placeholder="e.g., kg, tablet, ml"
                  value={formData.baseUnit}
                  onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })}
                  required
                />
                <Input
                  label="Stock Display Unit (how stock is shown)"
                  name="stockUnit"
                  placeholder="e.g., bag, pack, bottle"
                  value={formData.stockUnit}
                  onChange={(e) => setFormData({ ...formData, stockUnit: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`How many ${formData.baseUnit || 'base units'} in 1 ${formData.stockUnit || 'stock unit'}?`}
                  name="stockUnitEquivalent"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 25 (if 1 bag = 25 kg)"
                  value={formData.stockUnitEquivalent}
                  onChange={(e) => setFormData({ ...formData, stockUnitEquivalent: e.target.value })}
                  required
                />
                {!selectedProduct && (
                  <Input
                    label={`Initial Stock (in ${formData.stockUnit || 'stock units'})`}
                    name="initialStockInStockUnits"
                    type="number"
                    step="0.01"
                    placeholder={`e.g., 10 ${formData.stockUnit || 'units'}`}
                    value={formData.initialStockInStockUnits}
                    onChange={(e) => setFormData({ ...formData, initialStockInStockUnits: e.target.value })}
                  />
                )}
              </div>
              {formData.baseUnit && formData.stockUnit && formData.stockUnitEquivalent && formData.initialStockInStockUnits && (
                <p className="text-sm text-gray-500">
                  Total: {parseFloat(formData.initialStockInStockUnits) * parseFloat(formData.stockUnitEquivalent)} {formData.baseUnit}
                  ({formData.initialStockInStockUnits} {formData.stockUnit} × {formData.stockUnitEquivalent} {formData.baseUnit})
                </p>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-medium text-gray-700">Sale Units</p>
                  <Button type="button" variant="secondary" size="sm" onClick={addSaleUnit}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Unit
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Define how this product can be sold. Each sale unit has a name, price, and how many {formData.baseUnit || 'base units'} it equals.
                </p>

                {saleUnits.map((unit, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2 items-end">
                    <Input
                      label={index === 0 ? "Unit Name" : ""}
                      placeholder="e.g., bag, kg, tablet"
                      value={unit.name}
                      onChange={(e) => updateSaleUnit(index, 'name', e.target.value)}
                      required
                    />
                    <Input
                      label={index === 0 ? "Price (₦)" : ""}
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={unit.price}
                      onChange={(e) => updateSaleUnit(index, 'price', e.target.value)}
                      required
                    />
                    <Input
                      label={index === 0 ? `Equals (${formData.baseUnit || 'base units'})` : ""}
                      type="number"
                      step="0.01"
                      placeholder="Equivalent"
                      value={unit.equivalent}
                      onChange={(e) => updateSaleUnit(index, 'equivalent', e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeSaleUnit(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                      disabled={saleUnits.length === 1}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
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
