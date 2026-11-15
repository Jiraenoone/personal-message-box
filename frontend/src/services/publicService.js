import api from './api';

export const publicService = {
  /**
   * Get public info for a message box by slug ({ box, limits })
   */
  async getBox(slug) {
    const response = await api.get(`/public/boxes/${encodeURIComponent(slug)}`);
    return response.data;
  },

  /**
   * Submit a message with optional files.
   * @param {string} slug
   * @param {{ senderName: string, content: string, files: File[] }} data
   * @param {(percent: number) => void} [onProgress]
   */
  async submitMessage(slug, { senderName, content, files }, onProgress) {
    const formData = new FormData();
    formData.append('senderName', senderName);
    formData.append('content', content || '');
    files.forEach((file) => formData.append('files', file));

    const response = await api.post(`/public/boxes/${encodeURIComponent(slug)}/messages`, formData, {
      // multipart: axios drops this in the browser so the boundary is set automatically
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10 * 60 * 1000,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return response;
  },
};

export default publicService;
