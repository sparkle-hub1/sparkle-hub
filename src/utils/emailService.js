import emailjs from 'emailjs-com';
import { EMAILJS_CONFIG } from '../config/emailjs';

/**
 * Generates a cryptographically secure 6-digit OTP.
 * Uses crypto.getRandomValues for better entropy than Math.random().
 */
export function generateOTP() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

/**
 * Sends a verification OTP email to the given address via EmailJS.
 * @param {string} toEmail  - Recipient email address
 * @param {string} toName   - Recipient's full name
 * @param {string} otp      - The 6-digit verification code
 * @returns {Promise}
 */
export async function sendVerificationEmail(toEmail, toName, otp) {
  const templateParams = {
    to_email: toEmail,
    to_name: toName,
    otp_code: otp,
  };

  return emailjs.send(
    EMAILJS_CONFIG.SERVICE_ID,
    EMAILJS_CONFIG.TEMPLATE_ID,
    templateParams,
    EMAILJS_CONFIG.PUBLIC_KEY
  );
}

/**
 * Sends a dynamic Order Lifecycle email.
 * Uses ONE EmailJS template that adapts based on the order status passed.
 *
 * Supported statuses: 'Pending' | 'Confirmed' | 'Dispatched' | 'Delivered'
 *
 * @param {string} toEmail    - Customer's email
 * @param {string} toName     - Customer's full name
 * @param {string} orderId    - The Firestore Tracking ID
 * @param {number} grandTotal - Final total (PKR)
 * @param {string} status     - The new order status
 */
export async function sendOrderStatusEmail(toEmail, toName, orderId, grandTotal, status) {

  const statusThemes = {
    Pending: {
      header_gradient: 'linear-gradient(135deg, #fb7185, #be123c)',
      status_emoji: '📋',
      status_title: 'Order Received!',
      status_badge: '⏳ Pending Verification',
      badge_bg: '#fef9c3',
      badge_color: '#854d0e',
      status_message: `We've received your order and payment receipt. Our team will verify your transfer within 24 hours. Once confirmed, your resin masterpiece will enter production!`,
      next_step: 'Sit tight while we review your receipt.',
    },
    Confirmed: {
      header_gradient: 'linear-gradient(135deg, #34d399, #059669)',
      status_emoji: '✅',
      status_title: 'Payment Confirmed!',
      status_badge: '✅ Confirmed',
      badge_bg: '#dcfce7',
      badge_color: '#166534',
      status_message: `Great news! Your payment has been verified and confirmed. Our resin artists are now beginning to handcraft your masterpiece with love and care.`,
      next_step: 'Your order is now in production.',
    },
    Dispatched: {
      header_gradient: 'linear-gradient(135deg, #818cf8, #4f46e5)',
      status_emoji: '🚚',
      status_title: 'Order Dispatched!',
      status_badge: '🚚 On The Way',
      badge_bg: '#e0e7ff',
      badge_color: '#3730a3',
      status_message: `Exciting news! Your Sparkle Hub masterpiece is on its way to you. Please ensure someone is available to receive the package at your delivery address.`,
      next_step: 'Keep an eye on your doorstep!',
    },
    Delivered: {
      header_gradient: 'linear-gradient(135deg, #fbbf24, #d97706)',
      status_emoji: '🎊',
      status_title: 'Order Delivered!',
      status_badge: '🎊 Delivered',
      badge_bg: '#fef3c7',
      badge_color: '#92400e',
      status_message: `Your Sparkle Hub masterpiece has been delivered successfully! We hope you absolutely love your handcrafted resin artwork. Thank you for choosing Sparkle Hub 💖`,
      next_step: 'Enjoy your beautiful new masterpiece!',
    },
  };

  const theme = statusThemes[status] || statusThemes['Pending'];

  const templateParams = {
    to_email:        toEmail,
    to_name:         toName,
    order_id:        orderId,
    grand_total:     `PKR ${Number(grandTotal).toFixed(0)}`,
    order_status:    status,
    status_emoji:    theme.status_emoji,
    status_title:    theme.status_title,
    status_badge:    theme.status_badge,
    badge_bg:        theme.badge_bg,
    badge_color:     theme.badge_color,
    status_message:  theme.status_message,
    next_step:       theme.next_step,
    store_name:      'Sparkle Hub',
    shop_url:        window.location.origin,
  };

  return emailjs.send(
    EMAILJS_CONFIG.SERVICE_ID,
    EMAILJS_CONFIG.ORDER_TEMPLATE_ID,
    templateParams,
    EMAILJS_CONFIG.PUBLIC_KEY
  );
}
