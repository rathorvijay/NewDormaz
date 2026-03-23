const sendEmail = require('../utils/sendEmail');

const sendOrderConfirmation = async (user, order) => {
  const productRows = order.products.map(p =>
    `<tr style="border-bottom:1px solid #eee;">
      <td style="padding:8px;">${p.name}</td>
      <td style="padding:8px;text-align:center;">${p.size || '-'}</td>
      <td style="padding:8px;text-align:center;">${p.quantity}</td>
      <td style="padding:8px;text-align:right;">₹${p.price.toLocaleString('en-IN')}</td>
    </tr>`
  ).join('');

  await sendEmail({
    to: user.email,
    subject: `✅ Order Confirmed - #${order._id}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
        <div style="background:#1a237e;padding:30px 20px;text-align:center;">
          <h1 style="color:white;margin:0;">🛏️ Dormez Mattress</h1>
          <h2 style="color:#ffca28;margin:10px 0 0;">Order Confirmed!</h2>
        </div>
        <div style="padding:25px;">
          <p>Dear <strong>${order.shippingAddress.fullName}</strong>,</p>
          <p>Your order has been successfully placed. Here are the details:</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <thead>
              <tr style="background:#1a237e;color:white;">
                <th style="padding:10px;text-align:left;">Product</th>
                <th style="padding:10px;">Size</th>
                <th style="padding:10px;">Qty</th>
                <th style="padding:10px;text-align:right;">Price</th>
              </tr>
            </thead>
            <tbody>${productRows}</tbody>
          </table>
          <div style="text-align:right;background:#f5f5f5;padding:15px;border-radius:8px;">
            <p>Total: <strong style="font-size:18px;color:#1a237e;">₹${order.totalAmount.toLocaleString('en-IN')}</strong></p>
          </div>
          <div style="margin-top:20px;padding:15px;background:#e8eaf6;border-radius:8px;">
            <strong>Delivery to:</strong>
            <p>${order.shippingAddress.street}, ${order.shippingAddress.city}, 
            ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
          </div>
          <p style="margin-top:20px;">Estimated Delivery: <strong>${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN') : '5-7 days'}</strong></p>
        </div>
        <div style="background:#1a237e;padding:15px;text-align:center;">
          <p style="color:white;margin:0;">Sweet Dreams with Dormez! 🌙</p>
        </div>
      </div>
    `,
  });
};

const sendStatusUpdate = async (userEmail, userName, order) => {
  await sendEmail({
    to: userEmail,
    subject: `📦 Order Update: ${order.orderStatus}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1a237e;">🛏️ Dormez Mattress - Order Update</h2>
        <p>Dear ${userName},</p>
        <p>Your order <strong>#${order._id}</strong> status has been updated!</p>
        <div style="background:#1a237e;color:white;padding:20px;text-align:center;border-radius:8px;font-size:20px;font-weight:bold;">
          ${order.orderStatus}
        </div>
        <p style="margin-top:20px;">Track your order for real-time updates.</p>
      </div>
    `,
  });
};

module.exports = { sendOrderConfirmation, sendStatusUpdate };
