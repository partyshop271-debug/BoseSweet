(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  const UIProducts = {
    init: function () {
      this.cacheDOM();
      this.subscribeToEvents();
    },

    cacheDOM: function () {
      this.categoriesContainer = document.getElementById("categories-container");
      this.productsContainer = document.getElementById("products-container");
    },

    subscribeToEvents: function () {
      if (window.BoseSweets.EventBus) {
        window.BoseSweets.EventBus.on("products.data.loaded", (data) => {
          if (data) {
            this.renderCategories(data.categories || []);
            this.renderProducts(data.products || []);
          }
        });
      }
    },

    renderCategories: function (categories) {
      if (!this.categoriesContainer) return;
      this.categoriesContainer.innerHTML = "";

      if (categories.length === 0) {
        this.categoriesContainer.innerHTML = '<p class="empty-notify">جاري تحميل الأقسام الفاخرة...</p>';
        return;
      }

      categories.forEach(category => {
        if (category.deleted) return;

        const card = document.createElement("div");
        card.className = "category-card";
        card.setAttribute("data-id", category.id);

        const img = document.createElement("img");
        img.className = "category-thumb";
        img.alt = category.name;
        img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200' fill='%23F5F5F5'></svg>";
        img.setAttribute("data-src", category.image || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png");

        const title = document.createElement("h4");
        title.className = "category-title";
        title.textContent = category.name;

        card.appendChild(img);
        card.appendChild(title);

        card.addEventListener("click", () => {
          if (window.BoseSweets.EventBus) {
            window.BoseSweets.EventBus.emit("ui.category.selected", category.id);
          }
        });

        this.categoriesContainer.appendChild(card);
      });

      this.lazyLoadImages();
    },

    renderProducts: function (products) {
      if (!this.productsContainer) return;
      this.productsContainer.innerHTML = "";

      if (products.length === 0) {
        this.productsContainer.innerHTML = '<p class="empty-notify">جاري تحميل أحدث التشكيلات الفاخرة...</p>';
        return;
      }

      products.forEach(product => {
        if (product.deleted) return;

        const card = document.createElement("div");
        card.className = "product-card";
        card.setAttribute("data-id", product.id);

        const img = document.createElement("img");
        img.className = "product-thumb";
        img.alt = product.name;
        img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200' fill='%23F5F5F5'></svg>";
        img.setAttribute("data-src", product.image || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png");

        const title = document.createElement("h4");
        title.className = "product-title";
        title.textContent = product.name;

        const desc = document.createElement("p");
        desc.className = "product-desc";
        desc.textContent = product.description || "تم اختيار مكوناته بعناية للحصول على أفضل جودة طعم نقية تشرفك.";

        const metaRow = document.createElement("div");
        metaRow.className = "product-meta-row";

        const price = document.createElement("span");
        price.className = "product-price-display";
        price.textContent = `${product.price} جنيه`;

        const btn = document.createElement("button");
        btn.className = "add-to-cart-btn";
        btn.textContent = "إضافة للسلة";
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (window.BoseSweets.EventBus) {
            window.BoseSweets.EventBus.emit("cart.add.request", {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              quantity: 1
            });
          }
        });

        metaRow.appendChild(price);
        metaRow.appendChild(btn);

        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(metaRow);

        this.productsContainer.appendChild(card);
      });

      this.lazyLoadImages();
    },

    lazyLoadImages: function () {
      const lazyImages = document.querySelectorAll("img[data-src]");
      if ("IntersectionObserver" in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const image = entry.target;
              image.src = image.getAttribute("data-src");
              image.removeAttribute("data-src");
              imageObserver.unobserve(image);
            }
          });
        });
        lazyImages.forEach(image => imageObserver.observe(image));
      } else {
        lazyImages.forEach(image => {
          image.src = image.getAttribute("data-src");
          image.removeAttribute("data-src");
        });
      }
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    UIProducts.init();
    window.BoseSweets.UI = window.BoseSweets.UI || {};
    window.BoseSweets.UI.Products = UIProducts;
  });
})();
