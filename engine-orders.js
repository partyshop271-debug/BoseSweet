(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  const COLLECTION_NAME = "orders";
  const WHATSAPP_NUMBER = "201091572522"; 

  const OrderEngine = {
    createOrder: async function (customerData, shippingZoneId) {
      try {
        if (!window.BoseSweets.Engines.getCartSummary) {
          throw new Error("Cart Engine interface getCartSummary is unavailable.");
        }

        const currentCart = window.BoseSweets.Core.getState("cart");
        if (!currentCart || currentCart.items.length === 0) {
          throw new Error("Cannot process order: Cart is empty.");
        }

        const shippingCost = window.BoseSweets.Engines.getShippingCost ? window.BoseSweets.Engines.getShippingCost(shippingZoneId) : 0;
        const financialSummary = window.BoseSweets.Engines.getCartSummary(shippingCost);

        const orderSnapshot = {
          customer: {
            name: customerData.name,
            phone: customerData.phone,
            address: customerData.address,
            zoneId: shippingZoneId
          },
          items: currentCart.items.map(item => ({
            id: item.id,
            type: item.type,
            title: item.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice.amount,
            totalPrice: item.totalPrice.amount
          })),
          financials: {
            subtotal: financialSummary.subtotal.amount,
            shipping: financialSummary.shipping.amount,
            total: financialSummary.total.amount,
            currency: "EGP"
          },
          status: "new"
        };

        let savedOrder = null;
        if (window.BoseSweets.Integrations.createDocument) {
          try {
            savedOrder = await window.BoseSweets.Integrations.createDocument(COLLECTION_NAME, orderSnapshot);
            console.log("Order successfully backed up to Cloud Firestore.");
          } catch (dbError) {
            console.warn("Firestore backup delayed or offline. Proceeding to client dispatch.", dbError);
            savedOrder = {
              ...orderSnapshot,
              id: "OFFLINE-" + Date.now(),
              createdAt: new Date().toISOString()
            };
          }
        }

        if (window.BoseSweets.Core.emit) {
          window.BoseSweets.Core.emit("order.created", savedOrder);
        }

        const whatsappUrl = OrderEngine.generateWhatsAppLink(savedOrder);

        if (window.BoseSweets.Engines.clearCart) {
          window.BoseSweets.Engines.clearCart();
        }

        return {
          success: true,
          order: savedOrder,
          redirectUrl: whatsappUrl
        };
      } catch (error) {
        console.error("Order Processing Failure:", error);
        throw error;
      }
    },

    generateWhatsAppLink: function (order) {
      let message = `✨ طلب جديد من موقع حلويات بوسي ✨\n\n`;
      message += `👤 العميل: ${order.customer.name}\n`;
      message += `📞 رقم التواصل: ${order.customer.phone}\n`;
      message += `📍 العنوان: ${order.customer.address}\n\n`;
      message += `🛍️ تفاصيل الطلبات:\n`;

      order.items.forEach((item, index) => {
        message += `${index + 1}. ${item.title} (الكمية: ${item.quantity}) - ${item.totalPrice} جنيه\n`;
      });

      message += `\n💵 الحساب الإجمالي:\n`;
      message += `• المجموع الفرعي: ${order.financials.subtotal} جنيه\n`;
      message += `• تكلفة التوصيل: ${order.financials.shipping} جنيه\n`;
      message += `• الإجمالي النهائي: ${order.financials.total} جنيه\n\n`;
      message += ` تم تسجيل الطلب تلقائياً وجاري التجهيز.`;

      const encodedMessage = encodeURIComponent(message);
      return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`;
    },

    updateOrderStatus: async function (orderId, newStatus) {
      try {
        if (!window.BoseSweets.Integrations.updateDocument) {
          throw new Error("Firebase Service updateDocument interface is unavailable.");
        }

        await window.BoseSweets.Integrations.updateDocument(COLLECTION_NAME, orderId, { status: newStatus });
        
        if (window.BoseSweets.Core.emit) {
          window.BoseSweets.Core.emit("order.status.updated", { id: orderId, status: newStatus });
        }
        return true;
      } catch (error) {
        console.error(`Failed to update order status [${orderId}]:`, error);
        return false;
      }
    }
  };

  window.BoseSweets.Engines.OrderEngine = OrderEngine;
  window.BoseSweets.Engines.createOrder = OrderEngine.createOrder;
  window.BoseSweets.Engines.updateOrderStatus = OrderEngine.updateOrderStatus;
})();
