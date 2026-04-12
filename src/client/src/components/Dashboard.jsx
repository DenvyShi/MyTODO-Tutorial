import { useState, useEffect } from 'react';
import { useLists, useTasks } from '../hooks';
import { useLanguage } from '../i18n.jsx';
import Settings from './Settings';
import { 
  Plus, 
  List, 
  LogOut, 
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  GripVertical,
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  CalendarDays,
  CheckSquare,
  // Icons for lists
  ListTodo,
  Briefcase,
  User,
  Home,
  ShoppingCart,
  Heart,
  Star,
  Book,
  Music,
  Camera,
  Film,
  Gamepad2,
  Plane,
  Car,
  Bike,
  Utensils,
  Coffee,
  Dumbbell,
  GraduationCap,
  Code,
  Palette,
  Pen,
  Lightbulb,
  Target,
  Trophy,
  Gift,
  Bell,
  Bookmark,
  Folder,
  FileText
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskModal from './TaskModal';

// Icon mapping for lists
const ICON_MAP = {
  ListTodo,
  Briefcase,
  User,
  Home,
  ShoppingCart,
  Heart,
  Star,
  Book,
  Music,
  Camera,
  Film,
  Gamepad2,
  Plane,
  Car,
  Bike,
  Utensils,
  Coffee,
  Dumbbell,
  GraduationCap,
  Code,
  Palette,
  Pen,
  Lightbulb,
  Target,
  Trophy,
  Gift,
  Bell,
  Bookmark,
  Folder,
  FileText,
  List
};

// Get icon component by name
function ListIcon({ iconName, className }) {
  const IconComponent = ICON_MAP[iconName] || List;
  return <IconComponent className={className} />;
}

// Droppable view button for Today/Completed drag targets
function DroppableViewButton({ viewId, isSelected, sidebarCollapsed, onClick, icon: Icon, label }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `view-${viewId}`,
    data: { type: 'view', viewId }
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-full text-left rounded-lg transition flex items-center gap-2 ${
        isSelected ? 'bg-blue-600 text-white' : isOver ? 'bg-blue-500/50 ring-2 ring-blue-400' : 'hover:bg-slate-700'
      } ${sidebarCollapsed ? 'px-0 justify-center' : 'px-3'} py-2`}
      title={sidebarCollapsed ? label : ''}
    >
      <button onClick={onClick} className={`flex items-center gap-2 w-full ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        {!sidebarCollapsed && <span>{label}</span>}
      </button>
    </div>
  );
}

// Droppable list item for drag & drop
function DroppableList({ list, isSelected, sidebarCollapsed, onSelect, onDelete, taskCount }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `list-${list.id}`,
    data: { type: 'list', list }
  });

  return (
    <div
      ref={setNodeRef}
      className={`group flex items-center rounded-lg transition-all ${
        isSelected ? 'bg-blue-600' : isOver ? 'bg-blue-500/50 ring-2 ring-blue-400' : 'hover:bg-slate-700'
      } ${sidebarCollapsed ? 'justify-center' : ''}`}
    >
      <button
        onClick={() => onSelect(list.id)}
        className={`py-2 ${sidebarCollapsed ? 'px-0 w-full flex justify-center' : 'flex-1 text-left px-3'}`}
        title={sidebarCollapsed ? `${list.name}${taskCount > 0 ? ` (${taskCount})` : ''}` : ''}
      >
        <ListIcon iconName={list.icon} className="w-4 h-4 flex-shrink-0" />
        {!sidebarCollapsed && <span className="ml-2">{list.name}</span>}
        {!sidebarCollapsed && taskCount > 0 && <span className="ml-1 text-slate-400 text-sm">({taskCount})</span>}
      </button>
      {!sidebarCollapsed && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(list.id); }}
          className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

const PRIORITY_COLORS = {
  1: 'text-red-400',
  2: 'text-yellow-400', 
  3: 'text-slate-400'
};

function SortableTask({ task, onToggle, onEdit, onDelete, t, showListName }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityLabels = {
    1: t('priority.high'),
    2: t('priority.medium'),
    3: t('priority.low')
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-slate-700/50 rounded-lg p-4 flex items-start gap-3 group ${
        task.completed ? 'opacity-50' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-1 -m-1 touch-manipulation"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 flex-shrink-0"
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-slate-400 hover:text-blue-400" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${task.completed ? 'line-through text-slate-400' : ''}`}>
            {task.title}
          </span>
          <span className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
            {priorityLabels[task.priority]}
          </span>
          {showListName && task.list_name && (
            <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full">
              {task.list_name}
            </span>
          )}
        </div>
        
        {task.description && (
          <p className="text-sm text-slate-400 mt-1 truncate">{task.description}</p>
        )}
        
        {task.due_date && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
            <Clock className="w-3 h-3" />
            <span>{new Date(task.due_date).toLocaleString()}</span>
            {task.reminder_minutes && (
              <span className="text-blue-400 ml-1">
                ({task.reminder_minutes} {t('task.reminderBefore')})
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 hover:bg-slate-600 rounded"
        >
          <Edit3 className="w-4 h-4 text-slate-300" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 hover:bg-red-600/20 rounded"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}

export default function Dashboard({ user, onLogout }) {
  const { t } = useLanguage();
  const { lists, loading: listsLoading, createList, deleteList } = useLists();
  const [selectedListId, setSelectedListId] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'today', 'completed'
  
  // Calculate filter based on viewMode
  const taskFilter = {};
  if (viewMode === 'today') {
    taskFilter.today = true;
  } else if (viewMode === 'completed') {
    taskFilter.completed = true;
  }
  
  const { tasks, loading: tasksLoading, createTask, updateTask, toggleTask, deleteTask, reorderTasks } = useTasks(
    viewMode === 'all' ? selectedListId : null,
    taskFilter
  );

  // Fetch all tasks for counting per list
  const { tasks: allTasks, fetchTasks: fetchAllTasks } = useTasks(null, {});

  // Build task count map: listId -> count (mutable for optimistic updates)
  const [taskCountOverrides, setTaskCountOverrides] = useState(null);
  const taskCountMap = {};
  if (taskCountOverrides) {
    Object.entries(taskCountOverrides).forEach(([k, v]) => { taskCountMap[k] = v; });
  } else {
    allTasks.forEach(t => {
      taskCountMap[t.list_id] = (taskCountMap[t.list_id] || 0) + 1;
    });
  }
  
  // Reset overrides when allTasks changes
  useEffect(() => {
    setTaskCountOverrides(null);
  }, [allTasks]);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTask, setActiveTask] = useState(null); // 正在拖动的任务

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedList = lists.find(l => l.id === selectedListId);

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const overId = over.id.toString();

    // Check if dropped on Today view
    if (overId === 'view-today') {
      const task = tasks.find(t => t.id === active.id);
      if (task) {
        const today = new Date().toISOString().split('T')[0];
        updateTask(active.id, { due_date: today });
      }
      return;
    }

    // Check if dropped on Completed view
    if (overId === 'view-completed') {
      const task = tasks.find(t => t.id === active.id);
      if (task && !task.completed) {
        toggleTask(active.id);
      }
      return;
    }

    // Check if dropped on a list
    if (overId.startsWith('list-')) {
      const targetListId = parseInt(overId.replace('list-', ''));
      const task = tasks.find(t => t.id === active.id);
      
      if (task && task.list_id !== targetListId) {
        // Optimistic count update
        const newCounts = {};
        allTasks.forEach(t => {
          newCounts[t.list_id] = (newCounts[t.list_id] || 0) + 1;
        });
        newCounts[task.list_id] = (newCounts[task.list_id] || 0) - 1;
        newCounts[targetListId] = (newCounts[targetListId] || 0) + 1;
        setTaskCountOverrides(newCounts);

        // Move task to different list
        updateTask(active.id, { list_id: targetListId }).then(() => {
          fetchAllTasks(); // refresh counts from server
        });
      }
      return;
    }

    // Regular reordering within same list
    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      const updates = newTasks.map((task, index) => ({
        id: task.id,
        list_id: task.list_id,
        sort_order: index
      }));
      
      reorderTasks(updates);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    
    const newList = await createList(newListName.trim());
    setNewListName('');
    setShowNewListInput(false);
    setSelectedListId(newList.id);
  };

  const handleDeleteList = async (id) => {
    if (confirm(t('task.deleteConfirmList'))) {
      await deleteList(id);
      if (selectedListId === id) {
        setSelectedListId(null);
      }
    }
  };

  const handleCreateTask = async (data) => {
    await createTask({ ...data, list_id: selectedListId });
    setShowTaskModal(false);
  };

  const handleUpdateTask = async (data) => {
    await updateTask(editingTask.id, data);
    setEditingTask(null);
    setShowTaskModal(false);
  };

  const handleDeleteTask = async (id) => {
    if (confirm(t('task.deleteConfirm'))) {
      await deleteTask(id);
    }
  };

  if (listsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside 
          className={`
            relative bg-slate-800/50 border-r border-slate-700 flex flex-col transition-all duration-300 ease-in-out
            ${sidebarCollapsed ? 'w-16' : 'w-64'}
          `}
        >
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${sidebarCollapsed ? 'justify-center w-full' : ''}`}
              title={sidebarCollapsed ? 'Expand' : 'Collapse'}
            >
              <List className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <h1 className="text-xl font-bold">{t('app.title')}</h1>}
              {!sidebarCollapsed && <ChevronLeft className="w-4 h-4 text-slate-400 ml-1" />}
              {sidebarCollapsed && <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
            
            {!sidebarCollapsed && <Settings />}
          </div>
        </div>
        
        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
          <div className="space-y-1">
            <button
              onClick={() => { setViewMode('all'); setSelectedListId(null); }}
              className={`w-full text-left rounded-lg transition flex items-center gap-2 ${
                viewMode === 'all' && !selectedListId ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'
              } ${sidebarCollapsed ? 'px-0 justify-center' : 'px-3'} py-2`}
              title={sidebarCollapsed ? t('dashboard.allTasks') : ''}
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>{t('dashboard.allTasks')}</span>}
            </button>
            
            <DroppableViewButton
              viewId="today"
              isSelected={viewMode === 'today'}
              sidebarCollapsed={sidebarCollapsed}
              onClick={() => { setViewMode('today'); setSelectedListId(null); }}
              icon={CalendarDays}
              label={t('dashboard.today')}
            />
            
            <DroppableViewButton
              viewId="completed"
              isSelected={viewMode === 'completed'}
              sidebarCollapsed={sidebarCollapsed}
              onClick={() => { setViewMode('completed'); setSelectedListId(null); }}
              icon={CheckSquare}
              label={t('dashboard.completed')}
            />
          </div>
          
          <div className="mt-4">
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between mb-2 px-3">
                <span className="text-xs font-medium text-slate-400 uppercase">{t('dashboard.lists')}</span>
                <button
                  onClick={() => setShowNewListInput(true)}
                  className="p-1 hover:bg-slate-700 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {sidebarCollapsed && (
              <div className="flex justify-center mb-2">
                <button
                  onClick={() => {
                    setSidebarCollapsed(false);
                    setTimeout(() => setShowNewListInput(true), 300);
                  }}
                  className="p-2 hover:bg-slate-700 rounded"
                  title={t('dashboard.newList')}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {showNewListInput && !sidebarCollapsed && (
              <form onSubmit={handleCreateList} className="px-3 mb-2">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onBlur={() => setShowNewListInput(false)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={`${t('dashboard.newList')}...`}
                  autoFocus
                />
              </form>
            )}
            
            <div className="space-y-1">
              {lists.map((list) => (
                <DroppableList
                  key={list.id}
                  list={list}
                  isSelected={selectedListId === list.id && viewMode === 'all'}
                  sidebarCollapsed={sidebarCollapsed}
                  onSelect={(id) => { setViewMode('all'); setSelectedListId(id); }}
                  onDelete={handleDeleteList}
                  taskCount={taskCountMap[list.id] || 0}
                />
              ))}
            </div>
          </div>
        </nav>
        
        <div className={`p-4 border-t border-slate-700 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                {user.username[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium truncate">{user.username}</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center mb-4 flex-shrink-0" title={user.username}>
              {user.username[0].toUpperCase()}
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="text-xs text-slate-500 mb-3 text-center">
              v{__APP_VERSION__} · Build {__APP_BUILD__}
            </div>
          )}
          {sidebarCollapsed && (
            <div className="text-[9px] text-slate-500 mb-3 text-center">v{__APP_VERSION__}</div>
          )}
          <button
            onClick={onLogout}
            className={`text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition flex items-center gap-2 ${
              sidebarCollapsed ? 'p-2 justify-center' : 'w-full py-2 justify-center'
            }`}
            title={sidebarCollapsed ? t('menu.logout') : ''}
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>{t('menu.logout')}</span>}
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {viewMode === 'today' ? t('dashboard.today') : 
               viewMode === 'completed' ? t('dashboard.completed') :
               selectedList ? selectedList.name : t('dashboard.allTasks')}
            </h2>
            {selectedListId && viewMode === 'all' && (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('dashboard.newTask')}
              </button>
            )}
          </div>
        </header>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {tasksLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-slate-400 mt-20">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {viewMode === 'today' ? (t('dashboard.noTaskToday') || 'No tasks due today') :
                 viewMode === 'completed' ? (t('dashboard.noTaskCompleted') || 'No completed tasks') :
                 selectedListId ? t('dashboard.noTask') : (t('dashboard.noTaskAll') || 'No tasks in any list')}
              </p>
              {selectedListId && viewMode === 'all' && (
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowTaskModal(true);
                  }}
                  className="mt-4 text-blue-400 hover:text-blue-300"
                >
                  {t('dashboard.addFirstTask')}
                </button>
              )}
            </div>
          ) : (
            <SortableContext
              items={tasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-w-2xl">
                {tasks.map((task) => (
                  <SortableTask
                    key={task.id}
                    task={task}
                    t={t}
                    showListName={!selectedListId}
                    onToggle={toggleTask}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setShowTaskModal(true);
                    }}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </main>
      
      {/* Drag Overlay - 显示拖动时的任务 */}
      <DragOverlay>
        {activeTask ? (
          <div className="bg-slate-700/90 rounded-lg p-4 shadow-xl opacity-90">
            <div className="flex items-center gap-2">
              <span className="font-medium">{activeTask.title}</span>
              <span className={`text-xs ${PRIORITY_COLORS[activeTask.priority]}`}>
                {activeTask.priority === 1 ? t('priority.high') : activeTask.priority === 2 ? t('priority.medium') : t('priority.low')}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
      
      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          lists={lists}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
    </DndContext>
  );
}
