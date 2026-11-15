import { useState, useEffect, useCallback } from 'react';
import boxService from '../services/boxService';

export default function useBoxes() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBoxes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boxService.getBoxes();
      setBoxes(data);
    } catch (err) {
      setError(err.message || 'Failed to load message boxes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoxes();
  }, [fetchBoxes]);

  const createBox = async (boxData) => {
    const newBox = await boxService.createBox(boxData);
    setBoxes((prev) => [newBox, ...prev]);
    return newBox;
  };

  const updateBox = async (id, boxData) => {
    const updated = await boxService.updateBox(id, boxData);
    setBoxes((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await boxService.updateStatus(id, newStatus);
    setBoxes((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };

  const deleteBox = async (id) => {
    await boxService.deleteBox(id);
    setBoxes((prev) => prev.filter((b) => b.id !== id));
  };

  return {
    boxes,
    loading,
    error,
    refreshBoxes: fetchBoxes,
    createBox,
    updateBox,
    toggleStatus,
    deleteBox,
  };
}
