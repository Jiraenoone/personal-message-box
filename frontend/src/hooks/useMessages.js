import { useCallback, useEffect, useRef, useState } from 'react';
import messageService from '../services/messageService';

/**
 * Inbox state for one box: paginated, filterable, searchable message list.
 */
export default function useMessages(boxId, { limit = 20 } = {}) {
  const [messages, setMessages] = useState([]);
  const [box, setBox] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const fetchMessages = useCallback(async () => {
    const id = ++requestId.current; // ignore stale responses when filters change quickly
    setLoading(true);
    setError('');
    try {
      const data = await messageService.getMessages(boxId, { page, limit, filter, search });
      if (id !== requestId.current) return;
      setMessages(data.messages);
      setBox(data.box);
      setPagination(data.pagination);
      // Page emptied (e.g. after deleting its last message): step back
      if (data.messages.length === 0 && page > 1) setPage((p) => p - 1);
    } catch (err) {
      if (id === requestId.current) setError(err.message || 'Failed to load messages');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [boxId, page, limit, filter, search]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const changeFilter = (f) => { setFilter(f); setPage(1); };
  const changeSearch = (s) => { setSearch(s); setPage(1); };

  const deleteMessage = async (messageId) => {
    const result = await messageService.deleteMessage(boxId, messageId);
    await fetchMessages();
    return result;
  };

  const deleteAll = async () => {
    const result = await messageService.deleteAllMessages(boxId);
    setPage(1);
    await fetchMessages();
    return result;
  };

  return {
    messages, box, pagination, loading, error,
    page, setPage, filter, setFilter: changeFilter, search, setSearch: changeSearch,
    refresh: fetchMessages, deleteMessage, deleteAll,
  };
}
