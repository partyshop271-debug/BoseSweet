(function () {
  if (!window.BoseSweets) {
    console.error("BoseSweets Namespace is missing. Ensure core-bootstrap.js runs first.");
    return;
  }

  const cloudinaryConfig = {
    cloudName: "dyx4w0dr1",
    uploadPreset: "gcti28h"
  };

  const CloudinaryService = {
    uploadMedia: async function (file, folderName = "uploads") {
      try {
        console.log(`Initiating secure media upload to Cloudinary folder: [${folderName}]...`);
        
        const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
        const formData = new FormData();
        
        formData.append("file", file);
        formData.append("upload_preset", cloudinaryConfig.uploadPreset);
        formData.append("folder", `bose-sweets/${folderName}`);

        const response = await fetch(url, {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Cloudinary network response HTTP failure");
        }

        const data = await response.json();
        console.log("Media successfully uploaded to Cloudinary network.");

        const secureUrl = data.secure_url;
        const responsiveUrl = CloudinaryService.generateResponsiveUrl(secureUrl);

        const mediaReference = {
          id: data.public_id,
          url: responsiveUrl,
          alt: {
            ar: file.name ? file.name.split(".")[0] : "صورة حلويات بوسي",
            en: file.name ? file.name.split(".")[0] : "Bose Sweets product visual"
          }
        };

        if (window.BoseSweets.Core.EventBus && window.BoseSweets.Core.EventBus.emit) {
          window.BoseSweets.Core.EventBus.emit("media.uploaded", mediaReference);
        }

        return mediaReference;
      } catch (error) {
        console.error("Cloudinary Asset Upload Failure:", error);
        if (window.BoseSweets.Core.EventBus && window.BoseSweets.Core.EventBus.emit) {
          window.BoseSweets.Core.EventBus.emit("system.error", {
            type: "StorageError",
            message: `Cloudinary media processing failed: ${error.message}`,
            timestamp: new Date().toISOString()
          });
        }
        throw error;
      }
    },

    generateResponsiveUrl: function (originalUrl) {
      if (!originalUrl || !originalUrl.includes("res.cloudinary.com")) return originalUrl;
      
      const parts = originalUrl.split("/upload/");
      if (parts.length !== 2) return originalUrl;

      const transformationContract = "f_auto,q_auto:best,dpr_auto,w_auto,c_limit";
      return `${parts[0]}/upload/${transformationContract}/${parts[1]}`;
    },

    deleteMedia: async function (mediaId) {
      console.warn(`Direct client-side asset deletion blocked for security. Asset ID [${mediaId}] requires authorized admin session.`);
      return false;
    }
  };

  window.BoseSweets.Integrations.CloudinaryService = CloudinaryService;
  window.BoseSweets.Integrations.uploadMedia = CloudinaryService.uploadMedia;
  window.BoseSweets.Integrations.generateResponsiveUrl = CloudinaryService.generateResponsiveUrl;
})();