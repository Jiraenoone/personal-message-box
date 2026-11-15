import api from './api';

// Media is served by the backend; derive its origin from the API base URL
const API_ORIGIN = (api.defaults.baseURL || '/api').replace(/\/api\/?$/, '');

export const messageService = {
  /**
   * List messages in a box.
   * @returns {{ messages, box, pagination }}
   */
  async getMessages(boxId, { page = 1, limit = 20, filter = '', search = '' } = {}) {
    const params = { page, limit };
    if (filter) params.filter = filter;
    if (search) params.search = search;
    const response = await api.get(`/boxes/${boxId}/messages`, { params });
    return { ...response.data, pagination: response.pagination };
  },

  /** @returns {{ message, box }} */
  async getMessage(boxId, messageId) {
    const response = await api.get(`/boxes/${boxId}/messages/${messageId}`);
    return response.data;
  },

  /** @returns {{ storageCleanup }} */
  async deleteMessage(boxId, messageId) {
    const response = await api.delete(`/boxes/${boxId}/messages/${messageId}`);
    return response.data;
  },

  /** @returns {{ deleted, storageCleanup }} */
  async deleteAllMessages(boxId) {
    const response = await api.delete(`/boxes/${boxId}/messages`);
    return response.data;
  },

  /** Absolute URL for a file's stream path (e.g. "/api/messages/:id/files/:id") */
  fileUrl(path, { download = false } = {}) {
    if (!path) return null;
    return `${API_ORIGIN}${path}${download ? '?download=1' : ''}`;
  },
};

export default messageService;
