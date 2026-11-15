import api from './api';

export const driveService = {
  /**
   * Get Google OAuth connection URL or configuration status
   */
  async getConnectUrl() {
    const response = await api.get('/google-drive/connect');
    return response.data;
  },

  /**
   * Get current Google Drive connection status
   */
  async getStatus() {
    const response = await api.get('/google-drive/status');
    return response.data;
  },

  /**
   * Disconnect Google Drive
   */
  async disconnect() {
    const response = await api.post('/google-drive/disconnect');
    return response;
  },
};

export default driveService;
