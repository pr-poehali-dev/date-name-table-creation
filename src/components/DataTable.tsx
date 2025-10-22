import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TableRow {
  id: string;
  date: string;
  time: string;
  surname: string;
  color: string;
}

const colorOptions = [
  { value: 'red', label: 'Красный', border: 'border-red-500', bg: 'bg-red-50', hover: 'hover:bg-red-100', text: 'text-red-700' },
  { value: 'blue', label: 'Синий', border: 'border-blue-500', bg: 'bg-blue-50', hover: 'hover:bg-blue-100', text: 'text-blue-700' },
  { value: 'green', label: 'Зелёный', border: 'border-green-500', bg: 'bg-green-50', hover: 'hover:bg-green-100', text: 'text-green-700' },
  { value: 'yellow', label: 'Жёлтый', border: 'border-yellow-500', bg: 'bg-yellow-50', hover: 'hover:bg-yellow-100', text: 'text-yellow-700' },
  { value: 'purple', label: 'Фиолетовый', border: 'border-purple-500', bg: 'bg-purple-50', hover: 'hover:bg-purple-100', text: 'text-purple-700' },
  { value: 'pink', label: 'Розовый', border: 'border-pink-500', bg: 'bg-pink-50', hover: 'hover:bg-pink-100', text: 'text-pink-700' },
];

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
};

export const DataTable = () => {
  const timeSlots = generateTimeSlots();
  
  const [data, setData] = useState<TableRow[]>([
    { id: '1', date: '2025-01-20', time: '09:00', surname: 'Иванов', color: 'red' },
    { id: '2', date: '2025-01-20', time: '09:15', surname: 'Петров', color: 'blue' },
    { id: '3', date: '2025-01-20', time: '09:30', surname: 'Сидоров', color: 'green' },
  ]);
  
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'date' | 'time' | 'surname' | 'color' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleEdit = (id: string, field: 'date' | 'time' | 'surname' | 'color', currentValue: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  };

  const handleSave = () => {
    if (!editingCell) return;
    
    setData(data.map(row => 
      row.id === editingCell.id 
        ? { ...row, [editingCell.field]: editValue }
        : row
    ));
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleDelete = (id: string) => {
    setData(data.filter(row => row.id !== id));
  };

  const handleAdd = () => {
    const newId = (Math.max(...data.map(r => parseInt(r.id)), 0) + 1).toString();
    
    let newTime = '09:00';
    let newDate = new Date().toISOString().split('T')[0];
    
    if (data.length > 0) {
      const lastRow = data[data.length - 1];
      const lastTime = lastRow.time;
      const [hours, minutes] = lastTime.split(':').map(Number);
      let totalMinutes = hours * 60 + minutes + 15;
      
      if (totalMinutes >= 1440) {
        totalMinutes = 0;
        const lastDate = new Date(lastRow.date);
        lastDate.setDate(lastDate.getDate() + 1);
        newDate = lastDate.toISOString().split('T')[0];
      } else {
        newDate = lastRow.date;
      }
      
      const newHours = Math.floor(totalMinutes / 60);
      const newMinutes = totalMinutes % 60;
      newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    }
    
    setData([...data, { id: newId, date: newDate, time: newTime, surname: '', color: 'red' }]);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const draggedRow = data.find(row => row.id === draggedId);
    const targetRow = data.find(row => row.id === targetId);

    if (draggedRow && targetRow) {
      setData(data.map(row => {
        if (row.id === draggedId) {
          return { ...row, time: targetRow.time };
        }
        return row;
      }));
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      <Card className="overflow-hidden">
        <div className="bg-primary p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-foreground tracking-tight">
              DATA DASHBOARD
            </h1>
            <Button 
              onClick={handleAdd}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить запись
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary border-b border-border">
                <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-foreground uppercase tracking-wider">
                  Время
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-foreground uppercase tracking-wider">
                  Фамилия
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-foreground uppercase tracking-wider">
                  Цвет
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-secondary-foreground uppercase tracking-wider w-32">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {data.map((row, index) => {
                const isNewDay = index === 0 || data[index - 1].date !== row.date;
                
                return (
                  <>
                    {isNewDay && (
                      <tr key={`date-${row.date}`}>
                        <td colSpan={4} className="bg-secondary/50 px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Icon name="Calendar" size={18} className="text-secondary-foreground" />
                            <span className="font-semibold text-secondary-foreground">
                              {new Date(row.date).toLocaleDateString('ru-RU', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr 
                      key={row.id} 
                      className={`transition-colors ${
                        dragOverId === row.id ? 'bg-accent/20' : 'hover:bg-muted/50'
                      } ${draggedId === row.id ? 'opacity-50' : ''}`}
                      onDragOver={(e) => handleDragOver(e, row.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, row.id)}
                    >
                      <td className="px-6 py-4">
                    {editingCell?.id === row.id && editingCell.field === 'time' ? (
                      <Select value={editValue} onValueChange={setEditValue}>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map(slot => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div 
                        onClick={() => handleEdit(row.id, 'time', row.time)}
                        className="cursor-pointer text-foreground hover:text-accent transition-colors font-mono"
                      >
                        {row.time}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingCell?.id === row.id && editingCell.field === 'surname' ? (
                      <Input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave();
                          if (e.key === 'Escape') handleCancel();
                        }}
                        className="max-w-xs"
                        autoFocus
                      />
                    ) : (
                      <div 
                        draggable={!editingCell}
                        onDragStart={(e) => handleDragStart(e, row.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleEdit(row.id, 'surname', row.surname)}
                        className="cursor-move transition-colors font-medium flex items-center gap-2"
                      >
                        <Icon name="GripVertical" size={16} className="text-muted-foreground" />
                        <div className={`border-2 ${colorOptions.find(c => c.value === row.color)?.border} rounded-lg px-4 py-2 ${colorOptions.find(c => c.value === row.color)?.bg} ${colorOptions.find(c => c.value === row.color)?.hover} transition-colors shadow-sm`}>
                          <span className={`${colorOptions.find(c => c.value === row.color)?.text} font-semibold`}>{row.surname || '—'}</span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingCell?.id === row.id && editingCell.field === 'color' ? (
                      <Select value={editValue} onValueChange={setEditValue}>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map(color => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${color.bg} border-2 ${color.border}`}></div>
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div 
                        onClick={() => handleEdit(row.id, 'color', row.color)}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <div className={`w-6 h-6 rounded border-2 ${colorOptions.find(c => c.value === row.color)?.border} ${colorOptions.find(c => c.value === row.color)?.bg}`}></div>
                        <span className="text-sm text-muted-foreground">{colorOptions.find(c => c.value === row.color)?.label}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {editingCell?.id === row.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground"
                          >
                            <Icon name="Check" size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                          >
                            <Icon name="X" size={16} />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(row.id)}
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {data.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="Database" size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">Нет данных для отображения</p>
            <p className="text-sm mt-2">Нажмите "Добавить запись" чтобы начать</p>
          </div>
        )}

        <div className="bg-muted px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Всего записей: <span className="font-semibold text-foreground">{data.length}</span>
          </p>
        </div>
      </Card>
    </div>
  );
};