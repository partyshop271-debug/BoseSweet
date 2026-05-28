/**
 * =========================================================
 * Bose Sweets — WhatsApp Service
 * =========================================================
 * FILE: whatsapp-service.js
 * PURPOSE:
 * Send Orders To WhatsApp
 * =========================================================
 */

'use strict';

/**
 * =========================================================
 * CONFIG
 * =========================================================
 */

const SALES_NUMBER =
    '201097238441';

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function formatCurrency(value) {

    return `${value} ج.م`;
}

function formatItems(items = []) {

    if (!items.length) {
        return 'لا توجد منتجات';
    }

    return items.map((item, index) => {

        let line =
            `${index + 1}) ${item.title}`;

        if (item.size) {
            line += `\n- الحجم: ${item.size}`;
        }

        if (item.variant) {
            line += `\n- النكهة: ${item.variant}`;
        }

        line +=
            `\n- الكمية: ${item.quantity}`;

        line +=
            `\n- السعر: ${formatCurrency(item.price)}`;

        line += '\n';

        return line;

    }).join('\n');
}

/**
 * =========================================================
 * BUILD MESSAGE
 * =========================================================
 */

function buildMessage(order) {

    const {

        customer,
        delivery,
        items,
        subtotal,
        shippingCost,
        total

    } = order;

    return `
✨ طلب جديد - حلويات بوسي

👤 بيانات العميل:
الاسم: ${customer.name}

الهاتف: ${customer.phone}

📦 طريقة الاستلام:
${delivery.method === 'shipping'
    ? 'شحن'
    : 'استلام من الفرع'}

📍 المنطقة:
${delivery.region || '-'}

📅 موعد الاستلام:
${delivery.date}

⏰ الساعة:
${delivery.time}

🛍 المنتجات:
${formatItems(items)}

💰 إجمالي المنتجات:
${formatCurrency(subtotal)}

🚚 الشحن:
${formatCurrency(shippingCost)}

✅ الإجمالي النهائي:
${formatCurrency(total)}
`;
}

/**
 * =========================================================
 * SEND
 * =========================================================
 */

function sendOrder(order) {

    const message =
        buildMessage(order);

    const encoded =
        encodeURIComponent(message);

    const url =
        `https://wa.me/${SALES_NUMBER}?text=${encoded}`;

    window.open(
        url,
        '_blank'
    );
}

/**
 * =========================================================
 * EXPORT
 * =========================================================
 */

const WhatsAppService = {

    sendOrder
};

export default WhatsAppService;