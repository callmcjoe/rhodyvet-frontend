import { format, formatDistanceToNow } from 'date-fns';
import { PAINTS_PER_BAG } from './constants';

export const formatCurrency = (amount) => {
  return '₦' + new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatTimeAgo = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const paintsToDisplay = (paints) => {
  const bags = Math.floor(paints / PAINTS_PER_BAG);
  const remainingPaints = paints % PAINTS_PER_BAG;

  if (bags > 0 && remainingPaints > 0) {
    return `${bags} ${bags === 1 ? 'bag' : 'bags'} and ${remainingPaints} ${remainingPaints === 1 ? 'paint' : 'paints'}`;
  } else if (bags > 0) {
    return `${bags} ${bags === 1 ? 'bag' : 'bags'}`;
  } else {
    return `${remainingPaints} ${remainingPaints === 1 ? 'paint' : 'paints'}`;
  }
};

export const calculateFeedTotal = (quantities, product) => {
  const {
    quantityBags = 0,
    quantityHalfBags = 0,
    quantityThirdBags = 0,
    quantityPaints = 0,
    quantityHalfPaints = 0,
  } = quantities;

  return (
    quantityBags * (product.pricePerBag || 0) +
    quantityHalfBags * (product.pricePerHalfBag || 0) +
    quantityThirdBags * (product.pricePerThirdBag || 0) +
    quantityPaints * (product.pricePerPaint || 0) +
    quantityHalfPaints * (product.pricePerHalfPaint || 0)
  );
};

export const calculatePaintsEquivalent = (quantities) => {
  const {
    quantityBags = 0,
    quantityHalfBags = 0,
    quantityThirdBags = 0,
    quantityPaints = 0,
    quantityHalfPaints = 0,
  } = quantities;

  return (
    quantityBags * 8 +
    quantityHalfBags * 4 +
    quantityThirdBags * (8 / 3) +
    quantityPaints * 1 +
    quantityHalfPaints * 0.5
  );
};

export const getRoleBadgeColor = (role) => {
  switch (role) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-800';
    case 'admin':
      return 'bg-blue-100 text-blue-800';
    case 'sales_rep':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getDepartmentBadgeColor = (department) => {
  return department === 'feeds'
    ? 'bg-amber-100 text-amber-800'
    : 'bg-blue-100 text-blue-800';
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

export const generateSaleDescription = (sale) => {
  const itemCount = sale.items?.length || 0;
  return `${itemCount} item${itemCount !== 1 ? 's' : ''} - ${formatCurrency(sale.totalAmount)}`;
};
