export const DEPARTMENTS = [
  { value: 'feeds', label: 'Feeds' },
  { value: 'store', label: 'Store' },
];

export const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'sales_rep', label: 'Sales Rep' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
];

export const UNIT_TYPES = [
  { value: 'bag', label: 'Bag (Feeds)' },
  { value: 'quantity', label: 'Quantity (Store)' },
];

export const FEED_UNITS = [
  { value: 'bag', label: 'Bag', paints: 8 },
  { value: 'halfBag', label: '1/2 Bag', paints: 4 },
  { value: 'quarterBag', label: '1/4 Bag', paints: 2 },
  { value: 'paint', label: 'Paint', paints: 1 },
  { value: 'halfPaint', label: '1/2 Paint', paints: 0.5 },
];

export const REFUND_STATUS = {
  pending: { label: 'Pending', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'danger' },
};

export const SALE_STATUS = {
  completed: { label: 'Completed', color: 'success' },
  refund_pending: { label: 'Refund Pending', color: 'warning' },
  partially_refunded: { label: 'Partially Refunded', color: 'info' },
  fully_refunded: { label: 'Fully Refunded', color: 'danger' },
};

export const STOCK_ACTION_TYPES = {
  stock_in: { label: 'Stock In', color: 'success' },
  stock_out: { label: 'Stock Out', color: 'danger' },
  adjustment: { label: 'Adjustment', color: 'warning' },
  sale: { label: 'Sale', color: 'info' },
  refund: { label: 'Refund', color: 'info' },
};

export const PAINTS_PER_BAG = 8;

// Discount constants
export const DISCOUNT_PER_BAG = 200; // ₦200 discount per bag
export const MIN_BAGS_FOR_AUTO_DISCOUNT = 10; // Minimum bags for automatic discount

export const DISCOUNT_TYPES = {
  none: { label: 'No Discount', color: 'default' },
  automatic: { label: 'Automatic', color: 'success' },
  manual: { label: 'Manual', color: 'info' },
  approved: { label: 'Approved', color: 'success' },
};

export const DISCOUNT_REQUEST_STATUS = {
  pending: { label: 'Pending', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'danger' },
};

// Treatment constants
export const TREATMENT_TYPES = [
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'deworming', label: 'Deworming' },
  { value: 'treatment', label: 'Treatment' },
];

export const TREATMENT_STATUS = {
  scheduled: { label: 'Scheduled', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'danger' },
};

export const PET_TYPES = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'fish', label: 'Fish' },
  { value: 'reptile', label: 'Reptile' },
  { value: 'cattle', label: 'Cattle' },
  { value: 'goat', label: 'Goat' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'pig', label: 'Pig' },
  { value: 'poultry', label: 'Poultry' },
  { value: 'other', label: 'Other' },
];

// Chicken constants
export const CHICKEN_TYPES = [
  { value: 'broiler', label: 'Broiler' },
  { value: 'noiler', label: 'Noiler' },
  { value: 'turkey', label: 'Turkey' },
];

export const CHICKEN_TRANSACTION_TYPES = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'sale', label: 'Sale' },
];
