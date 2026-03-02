import { useState, useEffect } from 'react';
import { productAPI, salesAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { DEPARTMENTS, PAYMENT_METHODS } from '../../utils/constants';
import { formatCurrency, calculateFeedTotal, getDepartmentBadgeColor } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

const PointOfSale = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [departmentFilter, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = { isActive: true };
      if (departmentFilter) params.department = departmentFilter;
      if (searchTerm) params.search = searchTerm;
      const response = await productAPI.getAll(params);
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product._id === product._id);

    if (existingItem) {
      // For feeds, we'll update quantities through the cart UI
      if (product.unitType === 'quantity') {
        updateCartQuantity(product._id, existingItem.quantity + 1);
      }
    } else {
      const newItem = {
        product,
        productId: product._id,
        // For feeds
        quantityBags: 0,
        quantityHalfBags: 0,
        quantityThirdBags: 0,
        quantityPaints: 0,
        quantityHalfPaints: 0,
        // For store
        quantity: product.unitType === 'quantity' ? 1 : 0,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.product._id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const updateFeedQuantity = (productId, field, value) => {
    const numValue = parseInt(value) || 0;
    setCart(cart.map(item =>
      item.product._id === productId
        ? { ...item, [field]: Math.max(0, numValue) }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  const calculateItemTotal = (item) => {
    if (item.product.unitType === 'bag') {
      return calculateFeedTotal({
        quantityBags: item.quantityBags,
        quantityHalfBags: item.quantityHalfBags,
        quantityThirdBags: item.quantityThirdBags,
        quantityPaints: item.quantityPaints,
        quantityHalfPaints: item.quantityHalfPaints,
      }, item.product);
    }
    return item.quantity * item.product.pricePerUnit;
  };

  const cartTotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const isCartValid = () => {
    return cart.length > 0 && cart.every(item => {
      if (item.product.unitType === 'bag') {
        return item.quantityBags > 0 || item.quantityHalfBags > 0 ||
               item.quantityThirdBags > 0 || item.quantityPaints > 0 ||
               item.quantityHalfPaints > 0;
      }
      return item.quantity > 0;
    });
  };

  const handleCheckout = async () => {
    if (!isCartValid()) {
      toast.error('Please add quantities to all items');
      return;
    }

    setProcessing(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          quantityBags: item.quantityBags,
          quantityHalfBags: item.quantityHalfBags,
          quantityThirdBags: item.quantityThirdBags,
          quantityPaints: item.quantityPaints,
          quantityHalfPaints: item.quantityHalfPaints,
        })),
        paymentMethod,
      };

      const response = await salesAPI.create(saleData);
      setLastSale(response.data.data);
      setCart([]);
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      toast.success('Sale completed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Sale failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Products Section */}
      <div className="flex-1 space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Point of Sale</h1>

        {/* Search and Filter */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <Select
              placeholder="All Departments"
              options={DEPARTMENTS}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full md:w-48"
            />
          </div>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="col-span-full text-center py-8">Loading...</p>
          ) : products.length === 0 ? (
            <p className="col-span-full text-center py-8 text-gray-500">No products found</p>
          ) : (
            products.map(product => (
              <div
                key={product._id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary-500"
              >
                <Badge variant={product.department === 'feeds' ? 'feeds' : 'store'} size="sm">
                  {product.department}
                </Badge>
                <h3 className="font-medium mt-2 line-clamp-2">{product.name}</h3>
                <p className="text-primary-600 font-semibold mt-1">
                  {product.unitType === 'bag'
                    ? formatCurrency(product.pricePerBag)
                    : formatCurrency(product.pricePerUnit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{product.stockDisplay}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="lg:w-96 bg-white rounded-lg shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <ShoppingCartIcon className="h-6 w-6 text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold">Cart ({cart.length})</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.product._id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getDepartmentBadgeColor(item.product.department)}`}>
                      {item.product.department}
                    </span>
                    <h4 className="font-medium mt-1">{item.product.name}</h4>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>

                {item.product.unitType === 'quantity' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartQuantity(item.product._id, item.quantity - 1)}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product._id, item.quantity + 1)}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="font-semibold">{formatCurrency(calculateItemTotal(item))}</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Bags</label>
                        <input
                          type="number"
                          min="0"
                          value={item.quantityBags}
                          onChange={(e) => updateFeedQuantity(item.product._id, 'quantityBags', e.target.value)}
                          className="input py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">1/2 Bags</label>
                        <input
                          type="number"
                          min="0"
                          value={item.quantityHalfBags}
                          onChange={(e) => updateFeedQuantity(item.product._id, 'quantityHalfBags', e.target.value)}
                          className="input py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">1/3 Bags</label>
                        <input
                          type="number"
                          min="0"
                          value={item.quantityThirdBags}
                          onChange={(e) => updateFeedQuantity(item.product._id, 'quantityThirdBags', e.target.value)}
                          className="input py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Paints</label>
                        <input
                          type="number"
                          min="0"
                          value={item.quantityPaints}
                          onChange={(e) => updateFeedQuantity(item.product._id, 'quantityPaints', e.target.value)}
                          className="input py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">1/2 Paints</label>
                        <input
                          type="number"
                          min="0"
                          value={item.quantityHalfPaints}
                          onChange={(e) => updateFeedQuantity(item.product._id, 'quantityHalfPaints', e.target.value)}
                          className="input py-1 text-sm"
                        />
                      </div>
                    </div>
                    <p className="font-semibold text-right">{formatCurrency(calculateItemTotal(item))}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t space-y-4">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total:</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
          <Button
            fullWidth
            disabled={!isCartValid()}
            onClick={() => setIsCheckoutOpen(true)}
          >
            Checkout
          </Button>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Complete Sale"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(cartTotal)}</p>
          </div>

          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={PAYMENT_METHODS}
          />

          <div className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setIsCheckoutOpen(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleCheckout}
              loading={processing}
            >
              Confirm Sale
            </Button>
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Sale Receipt"
        size="md"
      >
        {lastSale && (
          <div className="space-y-4">
            <div className="text-center border-b pb-4">
              <h3 className="text-xl font-bold">Rhody Special Vet</h3>
              <p className="text-sm text-gray-500">Receipt #{lastSale.saleNumber}</p>
            </div>

            <div className="space-y-2">
              {lastSale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.productName}</span>
                  <span>{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(lastSale.totalAmount)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Payment: {lastSale.paymentMethod}
              </p>
            </div>

            <Button fullWidth onClick={() => setIsReceiptOpen(false)}>
              Done
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PointOfSale;
