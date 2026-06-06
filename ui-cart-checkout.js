(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  const UICartCheckout = {
    init: function () {
      this.cacheDOM();
      this.bindEvents();
      this.subscribeToEvents();
    },

    cacheDOM: function () {
      this.cartItemsWrapper = document.getElementById("cart-items-wrapper");
      this.subtotalDisplay = document.getElementById("cart-subtotal-display");
      this.checkoutBtn = document.getElementById("checkout-action-btn");
    },

    bindEvents: function () {
      if (this.checkoutBtn) {
        this.checkoutBtn.addEventListener("click", () => this.openCheckoutForm());
      }
    },

    subscribeToEvents: function () {
      if (window.BoseSweets.EventBus) {
        window.BoseSweets.EventBus.on("cart.changed", (cartData) => {
          this.renderCartItems(cartData);
        });
      }
    },

    renderCartItems: function (cart) {
      if (!this.cartItemsWrapper) return;
      this.cartItemsWrapper.innerHTML = "";

      if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        this.cartItemsWrapper.innerHTML = '<p style="text-align:center; padding:40px 10px; opacity:0.6; font-size:14px;">السلة فارغة حالياً.. تصفحي المنيو واختاري ما يناسبك.</p>';
        if (this.subtotalDisplay) this.subtotalDisplay.textContent = "0 جنيه";
        return;
      }

      cart.items.forEach(item => {
        const row = document.createElement("div");
        row.style.display = "block";
        row.style.padding = "12px 0";
        row.style.borderBottom = "1px solid rgba(255,145,164,0.15)";
        row.style.height = "75px";

        const title = document.createElement("span");
        title.style.float = "right";
        title.style.fontSize = "13px";
        title.style.fontWeight = "600";
        title.style.width = "160px";
        title.style.whiteSpace = "nowrap";
        title.style.overflow = "hidden";
        title.style.textOverflow = "ellipsis";
        title.textContent = item.title;

        const actionsWrapper = document.createElement("div");
        actionsWrapper.style.float = "left";
        actionsWrapper.style.textAlign = "left";

        const price = document.createElement("div");
        price.style.fontSize = "13px";
        price.style.fontWeight = "700";
        price.style.marginBottom = "4px";
        price.textContent = `${item.totalPrice.amount} جنيه`;

        const removeBtn = document.createElement("button");
        removeBtn.style.background = "none";
        removeBtn.style.border = "none";
        removeBtn.style.color = "#FF91A4";
        removeBtn.style.fontSize = "11px";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.fontFamily = "'Cairo'";
        removeBtn.textContent = "حذف";
        removeBtn.addEventListener("click", () => {
          if (window.BoseSweets.Engines && window.BoseSweets.Engines.removeItem) {
            window.BoseSweets.Engines.removeItem(item.id);
          }
        });

        actionsWrapper.appendChild(price);
        actionsWrapper.appendChild(removeBtn);
        row.appendChild(title);
        row.appendChild(actionsWrapper);
        this.cartItemsWrapper.appendChild(row);
      });

      if (this.subtotalDisplay) {
        this.subtotalDisplay.textContent = `${cart.subtotal.amount} جنيه`;
      }
    },

    openCheckoutForm: function () {
      const currentCart = window.BoseSweets.Core.getState("cart");
      if (!currentCart || !Array.isArray(currentCart.items) || currentCart.items.length === 0) return;

      if (!document.getElementById("simulator-modal-wrapper")) return;
      const modal = document.getElementById("simulator-modal-wrapper");

      modal.innerHTML = `
        <div style="background:#FFFFFF; max-width:450px; margin:40px auto; padding:25px; border-radius:6px; border:1px solid #FF91A4; position:relative;">
          <button id="close-checkout-modal-btn" style="position:absolute; top:15px; left:15px; background:none; border:none; font-size:24px; cursor:pointer;">&times;</button>
          <h3 style="font-weight:700; font-size:18px; margin-bottom:20px; border-bottom:1px solid rgba(255,145,164,0.3); padding-bottom:10px;">إتمام طلبك الراقي</h3>
          
          <div style="margin-bottom:12px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">الاسم الكريم:</label>
            <input type="text" id="checkout-name-input" placeholder="اكتبي اسمك هنا" style="width:100%; padding:8px; border:1px solid rgba(255,145,164,0.5); border-radius:4px; font-family:'Cairo'; font-size:13px;">
          </div>

          <div style="margin-bottom:12px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">رقم تليفون متاح للتواصل:</label>
            <input type="tel" id="checkout-phone-input" placeholder="رقم الموبايل المكون من 11 رقم" style="width:100%; padding:8px; border:1px solid rgba(255,145,164,0.5); border-radius:4px; font-family:'Cairo'; font-size:13px; direction:ltr; text-align:right;">
          </div>

          <div style="margin-bottom:15px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom:4px;">تفاصيل العنوان بمركز الفرافرة:</label>
            <input type="text" id="checkout-address-input" placeholder="اسم الشارع أو علامة مميزة بالقرب منك" style="width:100%; padding:8px; border:1px solid rgba(255,145,164,0.5); border-radius:4px; font-family:'Cairo'; font-size:13px;">
          </div>

          <button id="submit-final-order-btn" style="width:100%; background:#FFFFFF; border:1px solid #FF91A4; padding:10px; font-family:'Cairo'; font-weight:700; cursor:pointer; border-radius:4px; font-size:14px;">تأكيد وإرسال الطلب عبر الواتساب</button>
        </div>
      `;

      modal.style.display = "block";
      
      const closeBtn = document.getElementById("close-checkout-modal-btn");
      if (closeBtn) closeBtn.addEventListener("click", () => { modal.style.display = "none"; modal.innerHTML = ""; });

      const submitBtn = document.getElementById("submit-final-order-btn");
      if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
          const nameInput = document.getElementById("checkout-name-input").value.trim();
          const phoneInput = document.getElementById("checkout-phone-input").value.trim();
          const addressInput = document.getElementById("checkout-address-input").value.trim();

          if (nameInput.length < 3) {
            alert("فضلاً، ادخلي الاسم الكريم كاملاً بشكل صحيح.");
            return;
          }
          if (!/^01[0125][0-9]{8}$/.test(phoneInput)) {
            alert("فضلاً، ادخلي رقم موبايل مصري صحيح مكون من 11 رقم.");
            return;
          }
          if (addressInput.length < 5) {
            alert("فضلاً، وضحي العنوان بالتفصيل لضمان سرعة التوصيل.");
            return;
          }

          if (window.BoseSweets.Engines && window.BoseSweets.Engines.createOrder) {
            try {
              submitBtn.disabled = true;
              submitBtn.textContent = "جاري تحضير طلبك الفاخر...";
              
              const result = await window.BoseSweets.Engines.createOrder({
                name: nameInput,
                phone: phoneInput,
                address: addressInput
              }, "farafra-center");

              if (result && result.success && result.redirectUrl) {
                modal.style.display = "none";
                modal.innerHTML = "";
                window.location.href = result.redirectUrl;
              }
            } catch (err) {
              alert("عذراً، حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.");
              submitBtn.disabled = false;
              submitBtn.textContent = "تأكيد وإرسال الطلب عبر الواتساب";
            }
          }
        });
      }
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    UICartCheckout.init();
    window.BoseSweets.UI = window.BoseSweets.UI || {};
    window.BoseSweets.UI.CartCheckout = UICartCheckout;
    
    const initialCart = window.BoseSweets.Core.getState("cart");
    if (initialCart) UICartCheckout.renderCartItems(initialCart);
  });
})();
