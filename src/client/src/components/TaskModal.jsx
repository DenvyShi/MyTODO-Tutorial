import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

export default function TaskModal({ task, lists, onSave, onClose }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    list_id: lists[0]?.id || '',
    due_date: '',
    due_time: '',
    priority: 2,
    reminder_minutes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      setFormData({
        title: task.title,
        description: task.description || '',
        list_id: task.list_id,
        due_date: dueDate ? dueDate.toISOString().split('T')[0] : '',
        due_time: dueDate ? dueDate.toTimeString().slice(0, 5) : '',
        priority: task.priority,
        reminder_minutes: task.reminder_minutes || ''
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const dueDateTime = formData.due_date && formData.due_time
      ? new Date(`${formData.due_date}T${formData.due_time}`).toISOString()
      : formData.due_date
      ? new Date(formData.due_date).toISOString()
      : null;

    await onSave({
      title: formData.title,
      description: formData.description || null,
      list_id: formData.list_id,
      due_date: dueDateTime,
      priority: parseInt(formData.priority),
      reminder_minutes: formData.reminder_minutes ? parseInt(formData.reminder_minutes) : null
    });
    
    setLoading(false);
  };

  const priorityOptions = [
    { value: 1, label: t('priority.high'), color: 'bg-red-500' },
    { value: 2, label: t('priority.medium'), color: 'bg-yellow-500' },
    { value: 3, label: t('priority.low'), color: 'bg-slate-500' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold">
            {task ? t('task.editTask') : t('task.addTask')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('task.title')} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('task.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('task.list')}
            </label>
            <select
              value={formData.list_id}
              onChange={(e) => setFormData({ ...formData, list_id: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t('task.dueDate')}
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t('task.dueTime')}
              </label>
              <input
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('task.priority')}
            </label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: option.value })}
                  className={`flex-1 py-2 rounded-lg border-2 transition ${
                    formData.priority === option.value
                      ? `${option.color} border-transparent`
                      : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('task.reminder')}
            </label>
            <input
              type="number"
              value={formData.reminder_minutes}
              onChange={(e) => setFormData({ ...formData, reminder_minutes: e.target.value })}
              placeholder={t('task.reminderPlaceholder')}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              {t('task.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg transition"
            >
              {loading ? t('task.saving') : t('task.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
