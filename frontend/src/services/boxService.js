import api from './api';

export const boxService = {
  /**
   * Get all message boxes for current user
   */
  async getBoxes() {
    const response = await api.get('/boxes');
    return response.data.boxes;
  },

  /**
   * Get single message box details
   */
  async getBox(id) {
    const response = await api.get(`/boxes/${id}`);
    return response.data.box;
  },

  /**
   * Create a new message box
   */
  async createBox(data) {
    const response = await api.post('/boxes', data);
    return response.data.box;
  },

  /**
   * Update message box title / description
   */
  async updateBox(id, data) {
    const response = await api.patch(`/boxes/${id}`, data);
    return response.data.box;
  },

  /**
   * Update message box status (ACTIVE / INACTIVE)
   */
  async updateStatus(id, status) {
    const response = await api.patch(`/boxes/${id}/status`, { status });
    return response.data.box;
  },

  /**
   * Delete message box
   */
  async deleteBox(id) {
    const response = await api.delete(`/boxes/${id}`);
    return response;
  },

  /**
   * Get direct download URL for QR Code PNG
   */
  getQRCodeDownloadUrl(id) {
    return `/api/boxes/${id}/qr`;
  },
};

export default boxService;
