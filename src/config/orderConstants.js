export const ORDER_STATUSES = {
  all: 'Все',
  pending: 'Новые',
  processing: 'В работе',
  out_for_delivery: 'Доставляются',
  delivered: 'Выполненные',
  cancelled: 'Отмененные',
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'delivered': return '#4CAF50';
    case 'out_for_delivery': return '#2196F3';
    case 'processing': return '#FFC107';
    case 'cancelled': return '#F44336';
    case 'pending':
    default:
      return '#9E9E9E';
  }
};