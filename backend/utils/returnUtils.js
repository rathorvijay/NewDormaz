const ReturnRequest = require('../models/Return');

const RETURN_WINDOW_DEFAULT_DAYS = 7;
const RETURN_STATUSES = [
  'Requested',
  'Approved',
  'Rejected',
  'Pickup Scheduled',
  'Picked from customer',
  'Received at warehouse',
  'Quality Check Passed',
  'Quality Check Failed',
  'Refund Initiated',
  'Replacement Shipped',
  'Completed',
];

const getReturnDeadline = (deliveredAt, returnWindowDays = RETURN_WINDOW_DEFAULT_DAYS) => {
  if (!deliveredAt) return null;
  const deadline = new Date(deliveredAt);
  deadline.setDate(deadline.getDate() + Number(returnWindowDays || RETURN_WINDOW_DEFAULT_DAYS));
  return deadline;
};

const getCountdownMeta = (deadline) => {
  if (!deadline) return { expired: true, msRemaining: 0, daysRemaining: 0, countdownText: 'Return unavailable' };

  const msRemaining = new Date(deadline).getTime() - Date.now();
  const expired = msRemaining <= 0;

  if (expired) {
    return { expired: true, msRemaining: 0, daysRemaining: 0, countdownText: 'Return window closed' };
  }

  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const countdownText = daysRemaining <= 1
    ? 'Return available for less than 1 day'
    : `Return available for ${daysRemaining} more days`;

  return { expired: false, msRemaining, daysRemaining, countdownText };
};

const buildReturnMeta = ({ order, item, existingReturn }) => {
  const returnWindowDays = Number(item.returnWindowDays || RETURN_WINDOW_DEFAULT_DAYS);
  const deadline = getReturnDeadline(order.deliveredAt, returnWindowDays);
  const countdown = getCountdownMeta(deadline);
  const isDelivered = order.orderStatus === 'Delivered';
  const isReturnable = item.isReturnable !== false;

  let eligible = isDelivered && isReturnable && !countdown.expired && !existingReturn;
  let message = 'Eligible for return';

  if (!isDelivered) {
    eligible = false;
    message = 'Return available only after delivery';
  } else if (!isReturnable) {
    eligible = false;
    message = 'This item is not returnable';
  } else if (existingReturn) {
    eligible = false;
    message = `Return already ${existingReturn.status.toLowerCase()}`;
  } else if (countdown.expired) {
    eligible = false;
    message = 'Return window has expired';
  }

  return {
    eligible,
    message,
    deadline,
    deadlineText: deadline ? new Date(deadline).toLocaleDateString('en-IN') : null,
    returnWindowDays,
    ...countdown,
    existingReturn: existingReturn
      ? {
          _id: existingReturn._id,
          status: existingReturn.status,
          resolutionType: existingReturn.resolutionType,
          requestedAt: existingReturn.createdAt,
          highRisk: existingReturn.fraudSignals?.highRisk || false,
        }
      : null,
  };
};

const attachReturnMetadataToOrders = async (orders) => {
  if (!orders?.length) return orders;

  const orderIds = orders.map((order) => order._id);
  const returnRequests = await ReturnRequest.find({ orderId: { $in: orderIds } }).lean();
  const returnMap = new Map(
    returnRequests.map((request) => [`${request.orderId.toString()}_${request.orderItemId.toString()}`, request])
  );

  return orders.map((orderDoc) => {
    const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
    order.products = order.products.map((item) => {
      const existingReturn = returnMap.get(`${order._id.toString()}_${item._id.toString()}`);
      return {
        ...item,
        returnMeta: buildReturnMeta({ order, item, existingReturn }),
      };
    });

    order.returnRequests = returnRequests.filter(
      (request) => request.orderId.toString() === order._id.toString()
    );

    return order;
  });
};

module.exports = {
  RETURN_WINDOW_DEFAULT_DAYS,
  RETURN_STATUSES,
  getReturnDeadline,
  getCountdownMeta,
  buildReturnMeta,
  attachReturnMetadataToOrders,
};
