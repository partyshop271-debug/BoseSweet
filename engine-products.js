(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  const COLLECTION_NAME = "products";

  const ProductEngine = {
    createProduct: async function (productInput) {
      try {
        if (!window.BoseSweets.Integrations.createDocument) {
          throw new Error("Firebase Service createDocument interface is unavailable.");
        }
        
        const validation = ProductEngine.validateProduct(productInput);
        if (!validation.valid) {
          throw new Error(`ValidationError: ${validation.errors[0].message}`);
        }

        const productRecord = await window.BoseSweets.Integrations.createDocument(COLLECTION_NAME, {
          ...productInput,
          status: "published"
        });

        if (window.BoseSweets.Core.emit) {
          window.BoseSweets.Core.emit("product.created", productRecord);
        }

        return productRecord;
      } catch (error) {
        console.error("Engine Product Creation Error:", error);
        throw error;
      }
    },

    updateProduct: async function (productId, productInput) {
      try {
        if (!window.BoseSweets.Integrations.updateDocument) {
          throw new Error("Firebase Service updateDocument interface is unavailable.");
        }

        await window.BoseSweets.Integrations.updateDocument(COLLECTION_NAME, productId, productInput);
        const updatedRecord = await ProductEngine.getProduct(productId);

        if (window.BoseSweets.Core.emit) {
          window.BoseSweets.Core.emit("product.updated", updatedRecord);
        }

        return updatedRecord;
      } catch (error) {
        console.error(`Engine Product Update Error [${productId}]:`, error);
        throw error;
      }
    },

    archiveProduct: async function (productId) {
      try {
        await ProductEngine.updateProduct(productId, { status: "archived" });
        
        if (window.BoseSweets.Core.emit) {
          window.BoseSweets.Core.emit("product.archived", { id: productId, status: "archived" });
        }
        return true;
      } catch (error) {
        console.error(`Engine Product Archive Error [${productId}]:`, error);
        return false;
      }
    },

    restoreProduct: async function (productId) {
      try {
        return await ProductEngine.updateProduct(productId, { status: "published" });
      } catch (error) {
        console.error(`Engine Product Restore Error [${productId}]:`, error);
        throw error;
      }
    },

    getProduct: async function (productId) {
      try {
        if (!window.BoseSweets.Integrations.getDocument) {
          throw new Error("Firebase Service getDocument interface is unavailable.");
        }
        return await window.BoseSweets.Integrations.getDocument(COLLECTION_NAME, productId);
      } catch (error) {
        console.error(`Engine Fetch Product Error [${productId}]:`, error);
        throw error;
      }
    },

    getProducts: async function (filters = {}) {
      try {
        if (!window.BoseSweets.Integrations.queryDocuments) {
          throw new Error("Firebase Service queryDocuments interface is unavailable.");
        }

        const constraints = [];
        
        if (filters.status) {
          constraints.push({ type: "where", field: "status", operator: "==", value: filters.status });
        } else {
          constraints.push({ type: "where", field: "status", operator: "==", value: "published" });
        }

        if (filters.categoryId) {
          constraints.push({ type: "where", field: "categoryId", operator: "==", value: filters.categoryId });
        }

        if (filters.featured !== undefined) {
          constraints.push({ type: "where", field: "featured", operator: "==", value: !!filters.featured });
        }

        constraints.push({ type: "orderBy", field: "createdAt", direction: "desc" });

        return await window.BoseSweets.Integrations.queryDocuments(COLLECTION_NAME, constraints);
      } catch (error) {
        console.error("Engine Fetch Products List Error:", error);
        return [];
      }
    },

    searchProducts: async function (query) {
      try {
        const allProducts = await ProductEngine.getProducts();
        if (!query || query.trim() === "") return allProducts;

        const cleanQuery = query.toLowerCase().trim();

        const filtered = allProducts.filter(product => {
          const nameAr = product.name?.ar?.toLowerCase() || "";
          const nameEn = product.name?.en?.toLowerCase() || "";
          const descAr = product.description?.ar?.toLowerCase() || "";
          const descEn = product.description?.en?.toLowerCase() || "";
          
          return nameAr.includes(cleanQuery) || 
                 nameEn.includes(cleanQuery) || 
                 descAr.includes(cleanQuery) || 
                 descEn.includes(cleanQuery);
        });

        if (window.BoseSweets.Core.emit) {
          window.BoseSweets.Core.emit("search.executed", filtered);
        }

        return filtered;
      } catch (error) {
        console.error("Engine Search Products Error:", error);
        return [];
      }
    },

    validateProduct: function (productInput) {
      const result = { valid: true, errors: [] };
      
      if (!productInput.name || !productInput.name.ar || productInput.name.ar.trim() === "") {
        result.valid = false;
        result.errors.push({ field: "name.ar", code: "required", message: "اسم المنتج باللغة العربية مطلوب." });
      }
      
      if (!productInput.categoryId || productInput.categoryId.trim() === "") {
        result.valid = false;
        result.errors.push({ field: "categoryId", code: "required", message: "يجب اختيار قسم معتمد للمنتج." });
      }

      return result;
    }
  };

  window.BoseSweets.Engines.ProductEngine = ProductEngine;
  window.BoseSweets.Engines.createProduct = ProductEngine.createProduct;
  window.BoseSweets.Engines.updateProduct = ProductEngine.updateProduct;
  window.BoseSweets.Engines.archiveProduct = ProductEngine.archiveProduct;
  window.BoseSweets.Engines.getProduct = ProductEngine.getProduct;
  window.BoseSweets.Engines.getProducts = ProductEngine.getProducts;
  window.BoseSweets.Engines.searchProducts = ProductEngine.searchProducts;
})();