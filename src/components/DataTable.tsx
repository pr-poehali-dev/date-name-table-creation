import React, { useState } from 'react';
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
  surname2?: string;
  color2?: string;
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

interface SingleTableProps {
  title: string;
  initialData: TableRow[];
  onDataChange: (data: TableRow[]) => void;
  searchQuery: string;
  onDragFromTable: (item: {surname: string; color: string}, id: string) => void;
  onDragFromTable2: (item: {surname: string; color: string}, id: string) => void;
  onDropToTable: (targetId: string, item: {surname: string; color: string} | null, fromReserve: boolean, draggedId: string | null) => void;
  draggedId: string | null;
  dragOverId: string | null;
  setDragOverId: (id: string | null) => void;
  onDragEnd: () => void;
  onDeleteToReserve: (surname: string, color: string) => void;
}

const SingleTable: React.FC<SingleTableProps> = ({ 
  title, 
  initialData, 
  onDataChange, 
  searchQuery,
  onDragFromTable,
  onDragFromTable2,
  onDropToTable,
  draggedId,
  dragOverId,
  setDragOverId,
  onDeleteToReserve,
  onDragEnd
}) => {
  const timeSlots = generateTimeSlots();
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'date' | 'time' | 'surname' | 'color' | 'surname2' | 'color2' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (id: string, field: 'date' | 'time' | 'surname' | 'color' | 'surname2' | 'color2', currentValue: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  };

  const handleSave = () => {
    if (!editingCell) return;
    
    onDataChange(initialData.map(row => {
      if (row.id === editingCell.id) {
        if (editingCell.field === 'surname2' && editValue && !row.color2) {
          return { ...row, [editingCell.field]: editValue, color2: 'green' };
        }
        return { ...row, [editingCell.field]: editValue };
      }
      return row;
    }));
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleDelete = (id: string) => {
    const row = initialData.find(r => r.id === id);
    if (row && row.surname.trim()) {
      onDeleteToReserve(row.surname, row.color);
      onDataChange(initialData.map(r => r.id === id ? { ...r, surname: '', color: 'blue' } : r));
    }
  };

  const handleAdd = () => {
    const newId = `${title}-${Date.now()}`;
    
    let newTime = '09:00';
    let newDate = new Date().toISOString().split('T')[0];
    
    if (initialData.length > 0) {
      const lastRow = initialData[initialData.length - 1];
      newDate = lastRow.date;
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
    
    onDataChange([...initialData, { id: newId, date: newDate, time: newTime, surname: '', color: 'red', surname2: '', color2: 'green' }]);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    const row = initialData.find(r => r.id === id);
    if (row) {
      onDragFromTable({ surname: row.surname, color: row.color }, id);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStart2 = (e: React.DragEvent, id: string) => {
    const row = initialData.find(r => r.id === id);
    if (row && row.surname2) {
      onDragFromTable2({ surname: row.surname2, color: row.color2 || 'green' }, id);
    }
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

  const filteredData = initialData.filter(row => 
    row.surname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="flex-1 overflow-hidden">
      <div className="bg-primary p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-foreground tracking-tight">
            {title}
          </h1>
          <Button 
            onClick={handleAdd}
            className="bg-accent hover:bg-accent/90 text-accent-foreground h-8 text-sm"
            size="sm"
          >
            <Icon name="Plus" size={14} className="mr-1" />
            Добавить
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-secondary border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
                Время
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
                Фамилия
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
                Цвет
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-secondary-foreground uppercase tracking-wider w-24">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {(searchQuery ? filteredData : initialData).map((row, index, array) => {
              const isNewDay = index === 0 || array[index - 1].date !== row.date;
              
              return (
                <React.Fragment key={`fragment-${row.id}`}>
                  {isNewDay && (
                    <tr key={`date-${row.date}-${index}`} className="sticky top-12 z-10">
                      <td colSpan={4} className="bg-secondary px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Icon name="Calendar" size={16} className="text-secondary-foreground" />
                          <span className="font-semibold text-xs text-secondary-foreground">
                            {new Date(row.date).toLocaleDateString('ru-RU', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr 
                    key={`row-${row.id}`} 
                    className={`transition-colors ${
                      dragOverId === row.id ? 'bg-accent/20' : 'hover:bg-muted/50'
                    } ${draggedId === row.id ? 'opacity-50' : ''}`}
                    onDragOver={(e) => handleDragOver(e, row.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedId) {
                        const draggedRow = initialData.find(r => r.id === draggedId);
                        if (draggedRow && draggedId !== row.id) {
                          onDataChange(initialData.map(r => {
                            if (r.id === draggedId) {
                              return { ...r, date: row.date, time: row.time };
                            }
                            return r;
                          }));
                        }
                      }
                      onDragEnd();
                    }}
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
                          className="cursor-pointer text-foreground hover:text-accent transition-colors font-mono text-sm"
                        >
                          {row.time}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingCell?.id === row.id && editingCell.field === 'surname' ? (
                        <Input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                          }}
                          className="max-w-xs text-sm"
                          autoFocus
                        />
                      ) : editingCell?.id === row.id && editingCell.field === 'surname2' ? (
                        <Input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                          }}
                          className="max-w-xs text-sm"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div 
                            draggable={!editingCell}
                            onDragStart={(e) => handleDragStart(e, row.id)}
                            onDragEnd={onDragEnd}
                            onClick={() => handleEdit(row.id, 'surname', row.surname)}
                            className="cursor-move transition-colors font-medium flex items-center gap-1"
                          >
                            <Icon name="GripVertical" size={14} className="text-muted-foreground" />
                            <div className={`border-2 ${colorOptions.find(c => c.value === row.color)?.border} rounded-lg px-3 py-1 ${colorOptions.find(c => c.value === row.color)?.bg} ${colorOptions.find(c => c.value === row.color)?.hover} transition-colors shadow-sm`}>
                              <span className={`${colorOptions.find(c => c.value === row.color)?.text} font-semibold text-sm`}>{row.surname || '—'}</span>
                            </div>
                          </div>
                          {row.surname2 ? (
                            <div 
                              draggable={!editingCell}
                              onDragStart={(e) => handleDragStart2(e, row.id)}
                              onDragEnd={onDragEnd}
                              onClick={() => handleEdit(row.id, 'surname2', row.surname2 || '')}
                              className="cursor-move transition-colors font-medium flex items-center gap-1"
                            >
                              <Icon name="GripVertical" size={14} className="text-muted-foreground" />
                              <div className={`border-2 ${colorOptions.find(c => c.value === row.color2)?.border} rounded-lg px-3 py-1 ${colorOptions.find(c => c.value === row.color2)?.bg} ${colorOptions.find(c => c.value === row.color2)?.hover} transition-colors shadow-sm`}>
                                <span className={`${colorOptions.find(c => c.value === row.color2)?.text} font-semibold text-sm`}>{row.surname2}</span>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={() => handleEdit(row.id, 'surname2', row.surname2 || '')}
                              className="cursor-pointer transition-colors font-medium flex items-center gap-1"
                            >
                              <div className="border-2 border-dashed border-gray-300 rounded-lg px-3 py-1 bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm">
                                <span className="text-gray-400 font-semibold text-sm">+</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
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
                          className="cursor-pointer flex items-center gap-1"
                        >
                          <div className={`w-5 h-5 rounded border-2 ${colorOptions.find(c => c.value === row.color)?.border} ${colorOptions.find(c => c.value === row.color)?.bg}`}></div>
                          <span className="text-xs text-muted-foreground">{colorOptions.find(c => c.value === row.color)?.label}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {editingCell?.id === row.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleSave}
                              className="bg-accent hover:bg-accent/90 text-accent-foreground h-7 w-7 p-0"
                            >
                              <Icon name="Check" size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              className="h-7 w-7 p-0"
                            >
                              <Icon name="X" size={14} />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(row.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const generateThreeDaysData = (startDate: string, tablePrefix: string) => {
  const rows: TableRow[] = [];
  let id = 1;
  
  for (let day = 0; day < 3; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    const dateString = date.toISOString().split('T')[0];
    
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        rows.push({
          id: `${tablePrefix}-${id++}`,
          date: dateString,
          time: time,
          surname: '',
          color: 'blue',
          surname2: '',
          color2: 'green'
        });
      }
    }
  }
  
  return rows;
};

export const DataTable = () => {
  const today = new Date().toISOString().split('T')[0];
  
  const [data1, setData1] = useState<TableRow[]>(() => {
    const generated = generateThreeDaysData(today, 't1');
    generated[0] = { ...generated[0], surname: 'Иванов', color: 'red', surname2: 'Петров', color2: 'blue' };
    generated[1] = { ...generated[1], surname: 'Петров', color: 'blue', surname2: '', color2: 'green' };
    generated[2] = { ...generated[2], surname: 'Сидоров', color: 'green', surname2: '', color2: 'green' };
    return generated;
  });

  const [data2, setData2] = useState<TableRow[]>(() => {
    const generated = generateThreeDaysData(today, 't2');
    generated[0] = { ...generated[0], surname: 'Кузнецов', color: 'yellow' };
    generated[1] = { ...generated[1], surname: 'Смирнов', color: 'purple' };
    return generated;
  });
  
  const [reserve, setReserve] = useState<Array<{id: string; surname: string; color: string}>>([
    { id: 'r1', surname: 'Алексеев', color: 'purple' },
    { id: 'r2', surname: 'Новиков', color: 'pink' },
  ]);

  const [weekend, setWeekend] = useState<Array<{id: string; surname: string; color: string}>>([]);
  
  const [draggedFromReserve, setDraggedFromReserve] = useState(false);
  const [draggedFromWeekend, setDraggedFromWeekend] = useState(false);
  const [isOverReserve, setIsOverReserve] = useState(false);
  const [isOverWeekend, setIsOverWeekend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newReserveName, setNewReserveName] = useState('');
  const [isAddingToReserve, setIsAddingToReserve] = useState(false);
  const [newWeekendName, setNewWeekendName] = useState('');
  const [isAddingToWeekend, setIsAddingToWeekend] = useState(false);
  
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{surname: string; color: string} | null>(null);
  const [draggedFromSecond, setDraggedFromSecond] = useState(false);

  const handleReserveDragStart = (e: React.DragEvent, id: string) => {
    const item = reserve.find(r => r.id === id);
    if (item) {
      setDraggedItem({ surname: item.surname, color: item.color });
      setDraggedId(id);
      setDraggedFromReserve(true);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleReserveDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOverReserve(true);
  };

  const handleReserveDragLeave = () => {
    setIsOverReserve(false);
  };

  const handleDropToReserve = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedId || draggedFromReserve) {
      setDraggedId(null);
      setDraggedItem(null);
      setIsOverReserve(false);
      setDraggedFromSecond(false);
      return;
    }

    const draggedRow = [...data1, ...data2].find(row => row.id === draggedId);
    if (draggedRow) {
      if (draggedFromSecond && draggedRow.surname2) {
        const newReserveId = `r${Math.max(...reserve.map(r => parseInt(r.id.slice(1))), 0) + 1}`;
        setReserve([...reserve, { id: newReserveId, surname: draggedRow.surname2, color: draggedRow.color2 || 'green' }]);
        
        setData1(data1.map(row => row.id === draggedId ? { ...row, surname2: '', color2: 'green' } : row));
        setData2(data2.map(row => row.id === draggedId ? { ...row, surname2: '', color2: 'green' } : row));
      } else if (draggedRow.surname) {
        const newReserveId = `r${Math.max(...reserve.map(r => parseInt(r.id.slice(1))), 0) + 1}`;
        setReserve([...reserve, { id: newReserveId, surname: draggedRow.surname, color: draggedRow.color }]);
        
        setData1(data1.map(row => row.id === draggedId ? { ...row, surname: '' } : row));
        setData2(data2.map(row => row.id === draggedId ? { ...row, surname: '' } : row));
      }
    }

    setDraggedId(null);
    setDraggedItem(null);
    setIsOverReserve(false);
    setDraggedFromSecond(false);
  };

  const handleWeekendDragStart = (e: React.DragEvent, id: string) => {
    const item = weekend.find(w => w.id === id);
    if (item) {
      setDraggedItem({ surname: item.surname, color: item.color });
      setDraggedId(id);
      setDraggedFromWeekend(true);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleWeekendDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOverWeekend(true);
  };

  const handleWeekendDragLeave = () => {
    setIsOverWeekend(false);
  };

  const handleDropToWeekend = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedId || draggedFromWeekend) {
      setDraggedId(null);
      setDraggedItem(null);
      setIsOverWeekend(false);
      setDraggedFromSecond(false);
      return;
    }

    const draggedRow = [...data1, ...data2].find(row => row.id === draggedId);
    if (draggedRow) {
      if (draggedFromSecond && draggedRow.surname2) {
        const newWeekendId = `w${Math.max(...weekend.map(w => parseInt(w.id.slice(1))), 0) + 1}`;
        setWeekend([...weekend, { id: newWeekendId, surname: draggedRow.surname2, color: draggedRow.color2 || 'green' }]);
        
        setData1(data1.map(row => row.id === draggedId ? { ...row, surname2: '', color2: 'green' } : row));
        setData2(data2.map(row => row.id === draggedId ? { ...row, surname2: '', color2: 'green' } : row));
      } else if (draggedRow.surname) {
        const newWeekendId = `w${Math.max(...weekend.map(w => parseInt(w.id.slice(1))), 0) + 1}`;
        setWeekend([...weekend, { id: newWeekendId, surname: draggedRow.surname, color: draggedRow.color }]);
        
        setData1(data1.map(row => row.id === draggedId ? { ...row, surname: '' } : row));
        setData2(data2.map(row => row.id === draggedId ? { ...row, surname: '' } : row));
      }
    }

    setDraggedId(null);
    setDraggedItem(null);
    setIsOverWeekend(false);
    setDraggedFromSecond(false);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setDraggedItem(null);
    setDraggedFromReserve(false);
    setDraggedFromWeekend(false);
    setDraggedFromSecond(false);
    setIsOverReserve(false);
    setIsOverWeekend(false);
  };

  const handleAddToReserve = () => {
    if (!newReserveName.trim()) return;
    
    const newId = `r${Math.max(...reserve.map(r => parseInt(r.id.slice(1))), 0) + 1}`;
    setReserve([...reserve, { id: newId, surname: newReserveName.trim(), color: 'blue' }]);
    setNewReserveName('');
    setIsAddingToReserve(false);
  };

  const handleAddToWeekend = () => {
    if (!newWeekendName.trim()) return;
    
    const newId = `w${Math.max(...weekend.map(w => parseInt(w.id.slice(1))), 0) + 1}`;
    setWeekend([...weekend, { id: newId, surname: newWeekendName.trim(), color: 'blue' }]);
    setNewWeekendName('');
    setIsAddingToWeekend(false);
  };

  const handleDeleteToReserve = (surname: string, color: string) => {
    const newId = `r${Math.max(...reserve.map(r => parseInt(r.id.slice(1))), 0) + 1}`;
    setReserve([...reserve, { id: newId, surname, color }]);
  };

  const filteredReserve = reserve.filter(item => 
    item.surname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWeekend = weekend.filter(item => 
    item.surname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragFromTable = (item: {surname: string; color: string}, id: string) => {
    setDraggedItem(item);
    setDraggedId(id);
    setDraggedFromReserve(false);
    setDraggedFromWeekend(false);
    setDraggedFromSecond(false);
  };

  const handleDragFromTable2 = (item: {surname: string; color: string}, id: string) => {
    setDraggedItem(item);
    setDraggedId(id);
    setDraggedFromReserve(false);
    setDraggedFromWeekend(false);
    setDraggedFromSecond(true);
  };

  const handleDropToTable = (dataSet: TableRow[], setDataSet: (data: TableRow[]) => void, targetId: string) => {
    if (!draggedId) return;

    if (draggedFromReserve && draggedItem) {
      setDataSet(dataSet.map(row => 
        row.id === targetId 
          ? { ...row, surname: draggedItem.surname, color: draggedItem.color }
          : row
      ));
      setReserve(reserve.filter(r => r.id !== draggedId));
    }

    if (draggedFromWeekend && draggedItem) {
      setDataSet(dataSet.map(row => 
        row.id === targetId 
          ? { ...row, surname: draggedItem.surname, color: draggedItem.color }
          : row
      ));
      setWeekend(weekend.filter(w => w.id !== draggedId));
    }

    handleDragEnd();
  };

  return (
    <div className="w-full min-h-screen bg-background p-4">
      <div className="max-w-[1800px] mx-auto mb-4">
        <div className="bg-primary p-4 rounded-lg">
          <div className="relative max-w-md">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-foreground/60" />
            <Input
              type="text"
              placeholder="Поиск по фамилии..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto flex gap-4">
        <SingleTable 
          title="ТАБЛИЦА 1"
          initialData={data1}
          onDataChange={setData1}
          searchQuery={searchQuery}
          onDragFromTable={handleDragFromTable}
          onDragFromTable2={handleDragFromTable2}
          onDropToTable={(targetId) => handleDropToTable(data1, setData1, targetId)}
          draggedId={draggedId}
          dragOverId={dragOverId}
          setDragOverId={setDragOverId}
          onDragEnd={handleDragEnd}
          onDeleteToReserve={handleDeleteToReserve}
        />

        <SingleTable 
          title="ТАБЛИЦА 2"
          initialData={data2}
          onDataChange={setData2}
          searchQuery={searchQuery}
          onDragFromTable={handleDragFromTable}
          onDragFromTable2={handleDragFromTable2}
          onDropToTable={(targetId) => handleDropToTable(data2, setData2, targetId)}
          draggedId={draggedId}
          dragOverId={dragOverId}
          setDragOverId={setDragOverId}
          onDragEnd={handleDragEnd}
          onDeleteToReserve={handleDeleteToReserve}
        />

        <Card 
          className="w-72 shrink-0 overflow-hidden transition-colors"
          style={{ 
            boxShadow: isOverReserve ? '0 0 0 3px hsl(var(--accent))' : undefined,
          }}
          onDragOver={handleReserveDragOver}
          onDragLeave={handleReserveDragLeave}
          onDrop={handleDropToReserve}
        >
          <div className="bg-secondary p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Users" size={18} className="text-secondary-foreground" />
                <h2 className="text-base font-bold text-secondary-foreground tracking-tight">
                  Резерв
                </h2>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddingToReserve(true)}
                variant="outline"
                className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10 h-7 w-7 p-0"
              >
                <Icon name="UserPlus" size={14} />
              </Button>
            </div>

            {isAddingToReserve && (
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Введите фамилию..."
                  value={newReserveName}
                  onChange={(e) => setNewReserveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddToReserve();
                    if (e.key === 'Escape') {
                      setIsAddingToReserve(false);
                      setNewReserveName('');
                    }
                  }}
                  className="flex-1 h-8 text-sm bg-secondary-foreground/10 border-secondary-foreground/20"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleAddToReserve}
                  className="bg-accent hover:bg-accent/90 h-8 w-8 p-0"
                >
                  <Icon name="Check" size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddingToReserve(false);
                    setNewReserveName('');
                  }}
                  className="border-secondary-foreground/20 h-8 w-8 p-0"
                >
                  <Icon name="X" size={14} />
                </Button>
              </div>
            )}
          </div>

          <div className="p-3 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {filteredReserve.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="UserX" size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-xs">{searchQuery ? 'Ничего не найдено' : 'Резерв пуст'}</p>
                <p className="text-xs mt-1">{searchQuery ? 'Попробуйте другой запрос' : 'Перетащите сюда фамилии'}</p>
              </div>
            ) : (
              filteredReserve.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleReserveDragStart(e, item.id)}
                  onDragEnd={handleDragEnd}
                  className={`transition-all ${draggedId === item.id ? 'opacity-50' : ''}`}
                >
                  <div className={`border-2 ${colorOptions.find(c => c.value === item.color)?.border} rounded-lg px-3 py-2 ${colorOptions.find(c => c.value === item.color)?.bg} ${colorOptions.find(c => c.value === item.color)?.hover} transition-colors shadow-sm cursor-move flex items-center gap-1`}>
                    <Icon name="GripVertical" size={14} className="text-muted-foreground" />
                    <span className={`${colorOptions.find(c => c.value === item.color)?.text} font-semibold text-sm`}>
                      {item.surname}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card 
          className="w-72 shrink-0 overflow-hidden transition-colors"
          style={{ 
            boxShadow: isOverWeekend ? '0 0 0 3px hsl(var(--accent))' : undefined,
          }}
          onDragOver={handleWeekendDragOver}
          onDragLeave={handleWeekendDragLeave}
          onDrop={handleDropToWeekend}
        >
          <div className="bg-orange-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="CalendarOff" size={18} className="text-orange-700" />
                <h2 className="text-base font-bold text-orange-700 tracking-tight">
                  Выходные
                </h2>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddingToWeekend(true)}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-200 h-7 w-7 p-0"
              >
                <Icon name="UserPlus" size={14} />
              </Button>
            </div>

            {isAddingToWeekend && (
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Введите фамилию..."
                  value={newWeekendName}
                  onChange={(e) => setNewWeekendName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddToWeekend();
                    if (e.key === 'Escape') {
                      setIsAddingToWeekend(false);
                      setNewWeekendName('');
                    }
                  }}
                  className="flex-1 h-8 text-sm bg-white border-orange-300"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleAddToWeekend}
                  className="bg-orange-500 hover:bg-orange-600 text-white h-8 w-8 p-0"
                >
                  <Icon name="Check" size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddingToWeekend(false);
                    setNewWeekendName('');
                  }}
                  className="border-orange-300 h-8 w-8 p-0"
                >
                  <Icon name="X" size={14} />
                </Button>
              </div>
            )}
          </div>

          <div className="p-3 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {filteredWeekend.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="CalendarX" size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-xs">{searchQuery ? 'Ничего не найдено' : 'Список пуст'}</p>
                <p className="text-xs mt-1">{searchQuery ? 'Попробуйте другой запрос' : 'Перетащите сюда фамилии'}</p>
              </div>
            ) : (
              filteredWeekend.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleWeekendDragStart(e, item.id)}
                  onDragEnd={handleDragEnd}
                  className={`transition-all ${draggedId === item.id ? 'opacity-50' : ''}`}
                >
                  <div className={`border-2 ${colorOptions.find(c => c.value === item.color)?.border} rounded-lg px-3 py-2 ${colorOptions.find(c => c.value === item.color)?.bg} ${colorOptions.find(c => c.value === item.color)?.hover} transition-colors shadow-sm cursor-move flex items-center gap-1`}>
                    <Icon name="GripVertical" size={14} className="text-muted-foreground" />
                    <span className={`${colorOptions.find(c => c.value === item.color)?.text} font-semibold text-sm`}>
                      {item.surname}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DataTable;