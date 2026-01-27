/**
 * Direct upload to Cloudinary from frontend
 * This bypasses the backend server for much faster uploads
 */

const CLOUD_NAME = 'domedbbxb';
const UPLOAD_PRESET = 'fundora_unsigned';

/**
 * Upload a file directly to Cloudinary
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @param {string} resourceType - 'image' or 'video' (auto-detected if not provided)
 * @returns {Promise<{url: string, publicId: string, format: string}>}
 */
export const uploadToCloudinary = (file, onProgress = null, resourceType = null) => {
  return new Promise((resolve, reject) => {
    // Auto-detect resource type if not provided
    const type = resourceType || (file.type.startsWith('video') ? 'video' : 'image');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`);
    
    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.secure_url,
            publicId: response.public_id,
            format: response.format,
            width: response.width,
            height: response.height,
            duration: response.duration, // for videos
            resourceType: response.resource_type
          });
        } catch (e) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error?.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };
    
    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };
    
    xhr.ontimeout = () => {
      reject(new Error('Upload timed out'));
    };
    
    // Set a generous timeout for large files (5 minutes)
    xhr.timeout = 300000;
    
    xhr.send(formData);
  });
};

/**
 * Upload multiple files with combined progress tracking
 * @param {File[]} files - Array of files to upload
 * @param {Function} onProgress - Progress callback with {current, total, percent}
 * @returns {Promise<Array<{url: string, publicId: string}>>}
 */
export const uploadMultipleToCloudinary = async (files, onProgress = null) => {
  const results = [];
  const total = files.length;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    const result = await uploadToCloudinary(file, (filePercent) => {
      if (onProgress) {
        // Calculate overall progress
        const completedPercent = (i / total) * 100;
        const currentFileContribution = (filePercent / total);
        onProgress({
          current: i + 1,
          total,
          percent: Math.round(completedPercent + currentFileContribution),
          fileName: file.name
        });
      }
    });
    
    results.push(result);
  }
  
  return results;
};

export default { uploadToCloudinary, uploadMultipleToCloudinary };
