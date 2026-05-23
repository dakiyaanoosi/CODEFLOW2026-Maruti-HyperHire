export interface UploadResult {
  url: string;
  publicId: string;
  thumbnailUrl?: string;
}

export type UploadProgressCallback = (progress: number) => void;

export const isCloudinaryConfigured =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME !== undefined &&
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET !== undefined &&
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME !== "" &&
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET !== "";

// High-quality fallback stock items for simulated mode persistence
const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80", // Tech/Web Dev
  "https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=1000&auto=format&fit=crop&q=80", // UI/UX
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80", // Abstract Creative
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop&q=80", // Marketing/Analytics
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1000&auto=format&fit=crop&q=80", // UI Design
];

const STOCK_VIDEOS = [
  "https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-42308-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-developer-typing-on-a-keyboard-40660-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
];

const STOCK_PDF = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

/**
 * Uploads a file to Cloudinary or runs in local simulation mode
 */
export async function uploadFile(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!isCloudinaryConfigured || !cloudName || !uploadPreset) {
    return simulateUpload(file, onProgress);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Automatically detect resource type
    let resourceType = "auto";
    if (file.type.startsWith("image/")) {
      resourceType = "image";
    } else if (file.type.startsWith("video/")) {
      resourceType = "video";
    } else if (file.type === "application/pdf") {
      resourceType = "image"; // Cloudinary renders PDFs as images if wanted, or raw. Let's use image/raw.
    }
    
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    xhr.open("POST", url, true);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          // For videos or PDFs, Cloudinary might have generated a image format url or thumbnail
          const result: UploadResult = {
            url: response.secure_url,
            publicId: response.public_id,
          };
          if (response.resource_type === "video") {
            // Generate a thumbnail url from the video secure_url
            result.thumbnailUrl = response.secure_url.replace(/\.[^/.]+$/, ".jpg");
          }
          resolve(result);
        } catch (e) {
          reject(new Error("Failed to parse Cloudinary response"));
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          reject(new Error(response.error?.message || "Cloudinary upload failed"));
        } catch (e) {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during Cloudinary upload"));
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    xhr.send(formData);
  });
}

/**
 * Simulates a file upload with ticking progress and mock results
 */
function simulateUpload(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  return new Promise((resolve) => {
    let progress = 0;
    const intervalTime = 80; // ms
    const totalSteps = 12; // ~1 second total
    const increment = 100 / totalSteps;

    const timer = setInterval(async () => {
      progress += increment;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        if (onProgress) onProgress(100);

        const publicId = "simulated_" + Math.random().toString(36).substring(2, 9);
        const fileType = file.type;

        // Try reading small images as base64 for persistent local rendering
        if (fileType.startsWith("image/") && file.size < 1.5 * 1024 * 1024) {
          try {
            const base64Url = await fileToBase64(file);
            resolve({
              url: base64Url,
              publicId,
              thumbnailUrl: base64Url,
            });
            return;
          } catch (e) {
            console.error("Failed to read image as base64", e);
          }
        }

        // Fallback for large files or non-images to retain local URLs during current session
        let localUrl = "";
        try {
          localUrl = URL.createObjectURL(file);
        } catch (e) {
          localUrl = STOCK_IMAGES[Math.floor(Math.random() * STOCK_IMAGES.length)];
        }

        // Setup persistent fallback URLs for page refreshes
        let persistentUrl = localUrl;
        let thumbnailUrl = localUrl;

        if (fileType.startsWith("image/")) {
          persistentUrl = STOCK_IMAGES[Math.floor(Math.random() * STOCK_IMAGES.length)];
          thumbnailUrl = persistentUrl;
        } else if (fileType.startsWith("video/")) {
          persistentUrl = STOCK_VIDEOS[Math.floor(Math.random() * STOCK_VIDEOS.length)];
          thumbnailUrl = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80"; // Camera/Video stock image
        } else if (fileType === "application/pdf") {
          persistentUrl = STOCK_PDF;
          thumbnailUrl = "https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=80"; // Document/Library stock image
        }

        // We return the local ObjectURL as the immediate media URL, but we will have a way to fall back in the service layer if object URLs expire.
        // For convenience in mock mode, we will save both.
        resolve({
          url: localUrl,
          publicId,
          thumbnailUrl: fileType.startsWith("video/") ? thumbnailUrl : undefined,
          // Custom private flag to indicate simulated mode persistence URL
          ...{ _persistentUrl: persistentUrl, _persistentThumbnailUrl: thumbnailUrl }
        } as any);
      } else {
        if (onProgress) onProgress(Math.round(progress));
      }
    }, intervalTime);
  });
}

/**
 * Converts a file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
