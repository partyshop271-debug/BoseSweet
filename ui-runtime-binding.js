(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace missing. Execution halted.");
    return;
  }

  const LocalFallbackData = {
    categories: [
      { "id": "despacito", "name": "ديسباسيتو", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "qashtouta", "name": "قشطوطة", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "donuts", "name": "دوناتس", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "cinnabon", "name": "سينابون", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "flowers", "name": "زهور", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "happiness-cups", "name": "كاسات السعادة", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "chill-box", "name": "تشيل بوكس", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "cupcakes", "name": "كب كيك", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "cakes", "name": "تورتات", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "gateaux", "name": "جاتوه", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "mini-cakes", "name": "ميني كيك", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "red-velvet", "name": "ريد فيلفيت", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" }
    ],
    products: [
      { "id": "p1", "name": "سينابون قرفة فاخر", "price": 45, "categoryId": "cinnabon", "description": "سينابون هش غني بالقرفة الفاخرة مغطى بصوص الجبن السري الغني.", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "p2", "name": "دوناتس نوتيلا متفجرة", "price": 35, "categoryId": "donuts", "description": "عجينة الدوناتس الخفيفة محشوة ومغطاة بشوكولاتة النوتيلا الأصلية اللامعة.", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
      { "id": "p3", "name": "قشطوطة لوتس ملكية", "price": 65, "categoryId": "qashtouta", "description": "كيكة الحليب الغنية بالقشطة البلدية الفاخرة وزبدة اللوتس الأصلية مقرمشة.", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" }
    ]
  };

  async function hydrateStorefront() {
    try {
      if (window.BoseSweets.Engines && window.BoseSweets.Engines.getProducts) {
        const liveProducts = await window.BoseSweets.Engines.getProducts();
        if (liveProducts && liveProducts.length > 0) {
          triggerRender(LocalFallbackData.categories, liveProducts);
          return;
        }
      }
    } catch (err) {
      console.warn("Cloud protection activated.");
    }
    triggerRender(LocalFallbackData.categories, LocalFallbackData.products);
  }

  function triggerRender(categories, products) {
    if (window.BoseSweets.Core && window.BoseSweets.Core.EventBus) {
      window.BoseSweets.Core.EventBus.emit("products.data.loaded", {
        categories: categories,
        products: products
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(hydrateStorefront, 300);
  });
})();
