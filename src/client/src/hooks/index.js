import { useState, useEffect, useCallback } from 'react';
import { listsApi, tasksApi, authApi } from '../api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      const data = await authApi.login(username, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return { user, loading, error, login, logout };
}

export function useLists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = useCallback(async () => {
    try {
      const data = await listsApi.getAll();
      setLists(data);
    } catch (err) {
      console.error('Failed to fetch lists:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = useCallback(async (name) => {
    const newList = await listsApi.create(name);
    setLists(prev => [...prev, newList]);
    return newList;
  }, []);

  const updateList = useCallback(async (id, data) => {
    const updated = await listsApi.update(id, data);
    setLists(prev => prev.map(l => l.id === id ? updated : l));
    return updated;
  }, []);

  const deleteList = useCallback(async (id) => {
    await listsApi.delete(id);
    setLists(prev => prev.filter(l => l.id !== id));
  }, []);

  const reorderLists = useCallback(async (orders) => {
    await listsApi.reorder(orders);
    // Optimistic update
    const orderMap = new Map(orders.map(o => [o.id, o.sort_order]));
    setLists(prev => 
      prev.map(l => ({ ...l, sort_order: orderMap.get(l.id) ?? l.sort_order }))
        .sort((a, b) => a.sort_order - b.sort_order)
    );
  }, []);

  return { lists, loading, fetchLists, createList, updateList, deleteList, reorderLists };
}

export function useTasks(listId = null, filter = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (listId) params.list_id = listId;
      if (filter.today) params.today = 'true';
      if (filter.completed !== undefined) params.completed = filter.completed ? 'true' : 'false';
      if (filter.upcoming) params.upcoming = 'true';
      const data = await tasksApi.getAll(params);
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [listId, JSON.stringify(filter)]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (data) => {
    const newTask = await tasksApi.create(data);
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTask = useCallback(async (id, data) => {
    const updated = await tasksApi.update(id, data);
    
    // If task moved to different list and we're viewing a specific list, remove it
    if (listId && data.list_id && data.list_id !== listId) {
      setTasks(prev => prev.filter(t => t.id !== id));
    } else {
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    }
    
    return updated;
  }, [listId]);

  const toggleTask = useCallback(async (id) => {
    const updated = await tasksApi.toggle(id);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await tasksApi.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const reorderTasks = useCallback(async (taskUpdates) => {
    await tasksApi.reorder(taskUpdates);
    // Optimistic update
    const updateMap = new Map(taskUpdates.map(t => [t.id, { list_id: t.list_id, sort_order: t.sort_order }]));
    setTasks(prev =>
      prev.map(t => {
        const update = updateMap.get(t.id);
        return update ? { ...t, ...update } : t;
      }).sort((a, b) => a.sort_order - b.sort_order)
    );
  }, []);

  return { tasks, loading, fetchTasks, createTask, updateTask, toggleTask, deleteTask, reorderTasks };
}
