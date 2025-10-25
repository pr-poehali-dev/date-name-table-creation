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
  counter?: number;
  surname2?: string;
  color2?: string;
  counter2?: number;
  linkedId?: string;
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
  onDropToTable: (targetId: string, item: {surname: string; color: string} | null, fromReserve: boolean, draggedId: string | null, toSecondCell?: boolean) => void;
  draggedId: string | null;
  dragOverId: string | null;
  setDragOverId: (id: string | null) => void;
  onDragEnd: () => void;
  onReturnToReserve: (surname: string, color: string, surname2?: string, color2?: string) => void;
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
  onDragEnd,
  onReturnToReserve
}) => {
  const timeSlots = generateTimeSlots();
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'date' | 'time' | 'surname' | 'color' | 'surname2' | 'color2' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragOverSecondCell, setDragOverSecondCell] = useState<string | null>(null);
  const [linkedRows, setLinkedRows] = useState<Set<string>>(new Set());

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

  const handleToggleLink = (rowId: string) => {
    const newLinkedRows = new Set(linkedRows);
    if (newLinkedRows.has(rowId)) {
      newLinkedRows.delete(rowId);
    } else {
      newLinkedRows.add(rowId);
    }
    setLinkedRows(newLinkedRows);
  };

  const handleDelete = (id: string) => {
    const rowToDelete = initialData.find(r => r.id === id);
    if (rowToDelete) {
      if (rowToDelete.surname) {
        onReturnToReserve(rowToDelete.surname, rowToDelete.color, rowToDelete.surname2, rowToDelete.color2);
      } else if (rowToDelete.surname2) {
        onReturnToReserve(rowToDelete.surname2, rowToDelete.color2 || 'green');
      }
    }
    
    const updatedData = initialData.filter(r => r.id !== id);
    
    const lastRow = updatedData[updatedData.length - 1];
    let newTime = '09:00';
    let newDate = new Date().toISOString().split('T')[0];
    
    if (lastRow) {
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
    
    const newId = `${title}-${Date.now()}`;
    onDataChange([...updatedData, { id: newId, date: newDate, time: newTime, surname: '', color: 'red', surname2: '', color2: 'green' }]);
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
      
      if (linkedRows.has(id) && row.surname && row.surname2) {
        const dragPreview = document.createElement('div');
        dragPreview.style.position = 'absolute';
        dragPreview.style.top = '-1000px';
        dragPreview.style.display = 'flex';
        dragPreview.style.gap = '8px';
        dragPreview.style.padding = '8px';
        dragPreview.style.background = 'white';
        dragPreview.style.borderRadius = '8px';
        dragPreview.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        
        const colorClass1 = colorOptions.find(c => c.value === row.color);
        const colorClass2 = colorOptions.find(c => c.value === row.color2);
        
        dragPreview.innerHTML = `
          <div style="border: 2px solid; border-color: ${colorClass1?.border.replace('border-', '')}; border-radius: 6px; padding: 8px 12px; background: ${colorClass1?.bg.replace('bg-', '')}; display: flex; align-items: center; gap: 4px;">
            <span style="font-weight: 600; font-size: 14px;">${row.surname}</span>
          </div>
          <div style="border: 2px solid; border-color: ${colorClass2?.border.replace('border-', '')}; border-radius: 6px; padding: 8px 12px; background: ${colorClass2?.bg.replace('bg-', '')}; display: flex; align-items: center; gap: 4px;">
            <span style="font-weight: 600; font-size: 14px;">${row.surname2}</span>
          </div>
        `;
        
        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 0, 0);
        setTimeout(() => document.body.removeChild(dragPreview), 0);
      }
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
    <Card className="flex-1 overflow-hidden resize-x min-w-[300px] max-w-full">
      <div className="bg-primary p-2">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-bold text-primary-foreground tracking-tight">
            {title}
          </h1>
          <Button 
            onClick={handleAdd}
            className="bg-accent hover:bg-accent/90 text-accent-foreground h-6 text-xs"
            size="sm"
          >
            <Icon name="Plus" size={12} className="mr-1" />
            Добавить
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[calc(100vh-180px)] overflow-y-auto resize-y min-h-[200px]">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-secondary border-b border-border">
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-secondary-foreground uppercase tracking-wider">
                Время
              </th>
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-secondary-foreground uppercase tracking-wider">
                Фамилия
              </th>
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-secondary-foreground uppercase tracking-wider">
                Цвет
              </th>
              <th className="px-2 py-1.5 text-center text-[10px] font-semibold text-secondary-foreground uppercase tracking-wider w-16">
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
                    <tr key={`date-${row.date}-${index}`} className="sticky top-8 z-10">
                      <td colSpan={4} className="bg-secondary px-2 py-1">
                        <div className="flex items-center gap-1.5">
                          <Icon name="Calendar" size={12} className="text-secondary-foreground" />
                          <span className="font-semibold text-[10px] text-secondary-foreground">
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
                        if (draggedRow) {
                          if (draggedId !== row.id) {
                            onDataChange(initialData.map(r => {
                              if (r.id === draggedId) {
                                return { ...r, date: row.date, time: row.time };
                              }
                              return r;
                            }));
                          }
                        } else {
                          onDropToTable(row.id, null, false, draggedId, false);
                        }
                      }
                      onDragEnd();
                    }}
                  >
                    <td className="px-2 py-1.5">
                      {editingCell?.id === row.id && editingCell.field === 'time' ? (
                        <Select value={editValue} onValueChange={setEditValue}>
                          <SelectTrigger className="max-w-xs h-6 text-xs">
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
                        <div className="text-foreground font-mono text-[11px]">
                          {row.time}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
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
                            className="cursor-move transition-colors font-medium flex items-center gap-1"
                          >
                            <Icon name="GripVertical" size={10} className="text-muted-foreground" />
                            <div className={`border ${colorOptions.find(c => c.value === row.color)?.border} rounded px-2 py-0.5 ${colorOptions.find(c => c.value === row.color)?.bg} ${colorOptions.find(c => c.value === row.color)?.hover} transition-colors shadow-sm flex items-center gap-0.5 ${linkedRows.has(row.id) && row.surname2 ? 'ring-1 ring-accent' : ''}`}>
                              <span className={`text-[9px] font-mono font-bold ${(row.counter || 0) > 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{row.counter || 0}</span>
                              <span className={`${colorOptions.find(c => c.value === row.color)?.text} font-semibold text-[11px]`}>{row.surname || '—'}</span>
                            </div>
                          </div>
                          {row.surname && row.surname2 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleLink(row.id)}
                              className={`h-5 w-5 p-0 ${linkedRows.has(row.id) ? 'bg-accent/20' : 'hover:bg-accent/10'}`}
                              title={linkedRows.has(row.id) ? "Разорвать связь" : "Связать фамилии"}
                            >
                              <Icon name={linkedRows.has(row.id) ? "Unlink" : "Link"} size={10} className="text-muted-foreground" />
                            </Button>
                          )}
                          {row.surname2 ? (
                            <div 
                              draggable={!editingCell}
                              onDragStart={(e) => handleDragStart2(e, row.id)}
                              onDragEnd={onDragEnd}
                              className="cursor-move transition-colors font-medium flex items-center gap-1"
                            >
                              <Icon name="GripVertical" size={10} className="text-muted-foreground" />
                              <div className={`border ${colorOptions.find(c => c.value === row.color2)?.border} rounded px-2 py-0.5 ${colorOptions.find(c => c.value === row.color2)?.bg} ${colorOptions.find(c => c.value === row.color2)?.hover} transition-colors shadow-sm flex items-center gap-0.5 ${linkedRows.has(row.id) ? 'ring-1 ring-accent' : ''}`}>
                                <span className={`text-[9px] font-mono font-bold ${(row.counter2 || 0) > 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{row.counter2 || 0}</span>
                                <span className={`${colorOptions.find(c => c.value === row.color2)?.text} font-semibold text-[11px]`}>{row.surname2}</span>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverSecondCell(row.id);
                              }}
                              onDragLeave={(e) => {
                                e.stopPropagation();
                                setDragOverSecondCell(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (draggedId && draggedId !== row.id) {
                                  onDropToTable(row.id, null, false, draggedId, true);
                                }
                                setDragOverSecondCell(null);
                              }}
                              className={`cursor-pointer transition-colors font-medium flex items-center gap-1 ${
                                dragOverSecondCell === row.id ? 'scale-110' : ''
                              }`}
                            >
                              <div className={`border-2 ${
                                dragOverSecondCell === row.id 
                                  ? 'border-accent bg-accent/20' 
                                  : 'border-dashed border-gray-300 bg-gray-50'
                              } rounded px-2 py-0.5 hover:bg-gray-100 transition-all shadow-sm`}>
                                <span className="text-gray-400 font-semibold text-[11px]">+</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
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
                          <div className={`w-4 h-4 rounded border ${colorOptions.find(c => c.value === row.color)?.border} ${colorOptions.find(c => c.value === row.color)?.bg}`}></div>
                          <span className="text-[10px] text-muted-foreground">{colorOptions.find(c => c.value === row.color)?.label}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        {editingCell?.id === row.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleSave}
                              className="bg-accent hover:bg-accent/90 text-accent-foreground h-5 w-5 p-0"
                            >
                              <Icon name="Check" size={10} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              className="h-5 w-5 p-0"
                            >
                              <Icon name="X" size={10} />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(row.id)}
                            className="h-5 w-5 p-0"
                          >
                            <Icon name="Trash2" size={10} />
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
  
  const [reserve, setReserve] = useState<Array<{id: string; surname: string; color: string; linkedId?: string; counter?: number}>>([
    { id: 'r1', surname: 'Алексеев', color: 'purple', counter: 0 },
    { id: 'r2', surname: 'Новиков', color: 'pink', linkedId: 'r3', counter: 0 },
    { id: 'r3', surname: 'Морозов', color: 'green', linkedId: 'r2', counter: 0 },
  ]);

  const [weekend, setWeekend] = useState<Array<{id: string; surname: string; color: string; linkedId?: string; counter?: number}>>([]);
  const [otherJobs, setOtherJobs] = useState<Array<{id: string; surname: string; color: string; linkedId?: string; counter?: number}>>([]);
  
  const [draggedFromReserve, setDraggedFromReserve] = useState(false);
  const [draggedFromWeekend, setDraggedFromWeekend] = useState(false);
  const [draggedFromOtherJobs, setDraggedFromOtherJobs] = useState(false);
  const [isOverReserve, setIsOverReserve] = useState(false);
  const [isOverWeekend, setIsOverWeekend] = useState(false);
  const [isOverOtherJobs, setIsOverOtherJobs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newReserveName, setNewReserveName] = useState('');
  const [isAddingToReserve, setIsAddingToReserve] = useState(false);
  const [newWeekendName, setNewWeekendName] = useState('');
  const [isAddingToWeekend, setIsAddingToWeekend] = useState(false);
  const [newOtherJobsName, setNewOtherJobsName] = useState('');
  const [isAddingToOtherJobs, setIsAddingToOtherJobs] = useState(false);
  
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{surname: string; color: string} | null>(null);
  const [draggedFromSecond, setDraggedFromSecond] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [surnameCounters, setSurnameCounters] = useState<Record<string, number>>({});
  const [linkingMode, setLinkingMode] = useState<{ source: 'reserve' | 'weekend' | 'otherJobs'; id: string } | null>(null);

  const handleReserveDragStart = (e: React.DragEvent, id: string) => {
    const item = reserve.find(r => r.id === id);
    if (item) {
      setDraggedItem({ surname: item.surname, color: item.color });
      setDraggedId(id);
      setDraggedFromReserve(true);
      
      if (item.linkedId) {
        const linkedItem = reserve.find(r => r.id === item.linkedId);
        if (linkedItem) {
          const dragPreview = document.createElement('div');
          dragPreview.style.position = 'absolute';
          dragPreview.style.top = '-1000px';
          dragPreview.style.display = 'flex';
          dragPreview.style.gap = '8px';
          dragPreview.style.padding = '8px';
          dragPreview.style.background = 'white';
          dragPreview.style.borderRadius = '8px';
          dragPreview.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          
          const colorClass1 = colorOptions.find(c => c.value === item.color);
          const colorClass2 = colorOptions.find(c => c.value === linkedItem.color);
          
          dragPreview.innerHTML = `
            <div style="border: 2px solid ${colorClass1?.border.replace('border-', '')}; border-radius: 6px; padding: 8px 12px; background: ${colorClass1?.bg.replace('bg-', '')}; display: flex; align-items: center; gap: 4px;">
              <span style="font-weight: 600; font-size: 14px;">${item.surname}</span>
            </div>
            <div style="border: 2px solid ${colorClass2?.border.replace('border-', '')}; border-radius: 6px; padding: 8px 12px; background: ${colorClass2?.bg.replace('bg-', '')}; display: flex; align-items: center; gap: 4px;">
              <span style="font-weight: 600; font-size: 14px;">${linkedItem.surname}</span>
            </div>
          `;
          
          document.body.appendChild(dragPreview);
          e.dataTransfer.setDragImage(dragPreview, 0, 0);
          setTimeout(() => document.body.removeChild(dragPreview), 0);
        }
      }
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
      const maxId = Math.max(...reserve.map(r => parseInt(r.id.slice(1))), 0);
      
      if (draggedFromSecond && draggedRow.surname2) {
        const counter = Math.min((surnameCounters[draggedRow.surname2] || 0) + 1, 9);
        setSurnameCounters({...surnameCounters, [draggedRow.surname2]: counter});
        
        const newReserveId = `r${maxId + 1}`;
        setReserve([...reserve, { id: newReserveId, surname: draggedRow.surname2, color: draggedRow.color2 || 'green', counter }]);
        
        setData1(data1.map(row => row.id === draggedId ? { ...row, surname2: '', color2: 'green', counter2: 0 } : row));
        setData2(data2.map(row => row.id === draggedId ? { ...row, surname2: '', color2: 'green', counter2: 0 } : row));
      } else if (draggedRow.surname) {
        if (draggedRow.surname2) {
          const newReserveId1 = `r${maxId + 1}`;
          const newReserveId2 = `r${maxId + 2}`;
          
          const counter1 = Math.min((surnameCounters[draggedRow.surname] || 0) + 1, 9);
          const counter2 = Math.min((surnameCounters[draggedRow.surname2] || 0) + 1, 9);
          setSurnameCounters({...surnameCounters, [draggedRow.surname]: counter1, [draggedRow.surname2]: counter2});
          
          setReserve([
            ...reserve, 
            { id: newReserveId1, surname: draggedRow.surname, color: draggedRow.color, linkedId: newReserveId2, counter: counter1 },
            { id: newReserveId2, surname: draggedRow.surname2, color: draggedRow.color2 || 'green', linkedId: newReserveId1, counter: counter2 }
          ]);
        } else {
          const counter = Math.min((surnameCounters[draggedRow.surname] || 0) + 1, 9);
          setSurnameCounters({...surnameCounters, [draggedRow.surname]: counter});
          
          const newReserveId = `r${maxId + 1}`;
          setReserve([...reserve, { id: newReserveId, surname: draggedRow.surname, color: draggedRow.color, counter }]);
        }
        
        setData1(data1.map(row => row.id === draggedId ? { ...row, surname: '', surname2: '', color2: 'green', counter: 0, counter2: 0 } : row));
        setData2(data2.map(row => row.id === draggedId ? { ...row, surname: '', surname2: '', color2: 'green', counter: 0, counter2: 0 } : row));
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
      
      if (item.linkedId) {
        const linkedItem = weekend.find(w => w.id === item.linkedId);
        if (linkedItem) {
          const dragPreview = document.createElement('div');
          dragPreview.style.position = 'absolute';
          dragPreview.style.top = '-1000px';
          dragPreview.style.display = 'flex';
          dragPreview.style.gap = '8px';
          dragPreview.style.padding = '8px';
          dragPreview.style.background = 'white';
          dragPreview.style.borderRadius = '8px';
          dragPreview.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          
          const colorClass1 = colorOptions.find(c => c.value === item.color);
          const colorClass2 = colorOptions.find(c => c.value === linkedItem.color);
          
          dragPreview.innerHTML = `
            <div style="border: 2px solid ${colorClass1?.border.replace('border-', '')}; border-radius: 6px; padding: 8px 12px; background: ${colorClass1?.bg.replace('bg-', '')}; display: flex; align-items: center; gap: 4px;">
              <span style="font-weight: 600; font-size: 14px;">${item.surname}</span>
            </div>
            <div style="border: 2px solid ${colorClass2?.border.replace('border-', '')}; border-radius: 6px; padding: 8px 12px; background: ${colorClass2?.bg.replace('bg-', '')}; display: flex; align-items: center; gap: 4px;">
              <span style="font-weight: 600; font-size: 14px;">${linkedItem.surname}</span>
            </div>
          `;
          
          document.body.appendChild(dragPreview);
          e.dataTransfer.setDragImage(dragPreview, 0, 0);
          setTimeout(() => document.body.removeChild(dragPreview), 0);
        }
      }
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

    if (draggedFromOtherJobs && draggedItem) {
      const newWeekendId = `w${Math.max(...weekend.map(w => parseInt(w.id.slice(1))), 0) + 1}`;
      setWeekend([...weekend.filter(w => w.surname !== draggedItem.surname), { id: newWeekendId, surname: draggedItem.surname, color: draggedItem.color, counter: 0 }]);
      setOtherJobs(otherJobs.filter(o => o.id !== draggedId));
      
      setDraggedId(null);
      setDraggedItem(null);
      setIsOverWeekend(false);
      return;
    }

    const draggedRow = [...data1, ...data2].find(row => row.id === draggedId);
    if (draggedRow) {
      if (draggedFromSecond && draggedRow.surname2) {
        setSurnameCounters({...surnameCounters, [draggedRow.surname2]: 0});
        
        const newWeekendId = `w${Math.max(...weekend.map(w => parseInt(w.id.slice(1))), 0) + 1}`;
        setWeekend([...weekend.filter(w => w.surname !== draggedRow.surname2), { id: newWeekendId, surname: draggedRow.surname2, color: draggedRow.color2 || 'green', counter: 0 }]);
        setReserve(reserve.filter(r => r.surname !== draggedRow.surname2));
        
        setData1(data1.map(row => row.id === draggedId ? { ...row, surname2: '', color2: 'green', counter2: 0 } : row));
        setData2(data2.map(row => row.id === draggedId ? { ...row, surname2: '', color2: 'green', counter2: 0 } : row));
      } else if (draggedRow.surname) {
        setSurnameCounters({...surnameCounters, [draggedRow.surname]: 0});
        
        const newWeekendId = `w${Math.max(...weekend.map(w => parseInt(w.id.slice(1))), 0) + 1}`;
        setWeekend([...weekend.filter(w => w.surname !== draggedRow.surname), { id: newWeekendId, surname: draggedRow.surname, color: draggedRow.color, counter: 0 }]);
        setReserve(reserve.filter(r => r.surname !== draggedRow.surname));
        
        setData1(data1.map(row => row.id === draggedId ? { ...row, surname: '', counter: 0 } : row));
        setData2(data2.map(row => row.id === draggedId ? { ...row, surname: '', counter: 0 } : row));
      }
    }

    setDraggedId(null);
    setDraggedItem(null);
    setIsOverWeekend(false);
    setDraggedFromSecond(false);
  };

  const handleOtherJobsDragStart = (e: React.DragEvent, id: string) => {
    const item = otherJobs.find(o => o.id === id);
    if (item) {
      setDraggedItem({ surname: item.surname, color: item.color });
      setDraggedId(id);
      setDraggedFromOtherJobs(true);
      
      if (item.linkedId) {
        const linkedItem = otherJobs.find(o => o.id === item.linkedId);
        if (linkedItem) {
          const dragPreview = document.createElement('div');
          dragPreview.style.position = 'absolute';
          dragPreview.style.top = '-1000px';
          dragPreview.style.display = 'flex';
          dragPreview.style.gap = '8px';
          dragPreview.style.padding = '8px';
          dragPreview.style.background = 'white';
          dragPreview.style.borderRadius = '8px';
          dragPreview.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          
          const colorClass1 = colorOptions.find(c => c.value === item.color);
          const colorClass2 = colorOptions.find(c => c.value === linkedItem.color);
          
          dragPreview.innerHTML = `
            <div style="border: 2px solid ${colorClass1?.border.replace('border-', '')}; border-radius: 6px; padding: 8px 12px; background: ${colorClass1?.bg.replace('bg-', '')}; display: flex; align-items: center; gap: 4px;">
              <span style="font-weight: 600; font-size: 14px;">${item.surname}</span>
            </div>
            <div style="border: 2px solid ${colorClass2?.border.replace('border-', '')}; border-radius: 6px; padding: 8px 12px; background: ${colorClass2?.bg.replace('bg-', '')}; display: flex; align-items: center; gap: 4px;">
              <span style="font-weight: 600; font-size: 14px;">${linkedItem.surname}</span>
            </div>
          `;
          
          document.body.appendChild(dragPreview);
          e.dataTransfer.setDragImage(dragPreview, 0, 0);
          setTimeout(() => document.body.removeChild(dragPreview), 0);
        }
      }
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleOtherJobsDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOverOtherJobs(true);
  };

  const handleOtherJobsDragLeave = () => {
    setIsOverOtherJobs(false);
  };

  const handleDropToOtherJobs = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedId || draggedFromOtherJobs) {
      setDraggedId(null);
      setDraggedItem(null);
      setIsOverOtherJobs(false);
      setDraggedFromSecond(false);
      return;
    }

    if (draggedFromWeekend && draggedItem) {
      const currentCounter = surnameCounters[draggedItem.surname] || 0;
      const newOtherJobsId = `o${Math.max(...otherJobs.map(o => parseInt(o.id.slice(1))), 0) + 1}`;
      setOtherJobs([...otherJobs.filter(o => o.surname !== draggedItem.surname), { id: newOtherJobsId, surname: draggedItem.surname, color: draggedItem.color, counter: currentCounter }]);
      setWeekend(weekend.filter(w => w.id !== draggedId));
      
      setDraggedId(null);
      setDraggedItem(null);
      setIsOverOtherJobs(false);
      return;
    }

    const draggedRow = [...data1, ...data2].find(row => row.id === draggedId);
    if (draggedRow) {
      if (draggedFromSecond && draggedRow.surname2) {
        const currentCounter = surnameCounters[draggedRow.surname2] || 0;
        setSurnameCounters({...surnameCounters, [draggedRow.surname2]: currentCounter});
        
        const newOtherJobsId = `o${Math.max(...otherJobs.map(o => parseInt(o.id.slice(1))), 0) + 1}`;
        setOtherJobs([...otherJobs.filter(o => o.surname !== draggedRow.surname2), { id: newOtherJobsId, surname: draggedRow.surname2, color: draggedRow.color2 || 'green', counter: currentCounter }]);
        setReserve(reserve.filter(r => r.surname !== draggedRow.surname2));
        
        setData1(data1.map(row => row.id === draggedId ? { ...row, surname2: '', color2: 'green', counter2: 0 } : row));
        setData2(data2.map(row => row.id === draggedId ? { ...row, surname2: '', color2: 'green', counter2: 0 } : row));
      } else if (draggedRow.surname) {
        const currentCounter = surnameCounters[draggedRow.surname] || 0;
        setSurnameCounters({...surnameCounters, [draggedRow.surname]: currentCounter});
        
        const newOtherJobsId = `o${Math.max(...otherJobs.map(o => parseInt(o.id.slice(1))), 0) + 1}`;
        setOtherJobs([...otherJobs.filter(o => o.surname !== draggedRow.surname), { id: newOtherJobsId, surname: draggedRow.surname, color: draggedRow.color, counter: currentCounter }]);
        setReserve(reserve.filter(r => r.surname !== draggedRow.surname));
        
        setData1(data1.map(row => row.id === draggedId ? { ...row, surname: '', counter: 0 } : row));
        setData2(data2.map(row => row.id === draggedId ? { ...row, surname: '', counter: 0 } : row));
      }
    }

    setDraggedId(null);
    setDraggedItem(null);
    setIsOverOtherJobs(false);
    setDraggedFromSecond(false);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setDraggedItem(null);
    setDraggedFromReserve(false);
    setDraggedFromWeekend(false);
    setDraggedFromOtherJobs(false);
    setDraggedFromSecond(false);
    setIsOverReserve(false);
    setIsOverWeekend(false);
    setIsOverOtherJobs(false);
  };

  const handleAddToReserve = () => {
    if (!newReserveName.trim()) return;
    
    const newId = `r${Math.max(...reserve.map(r => parseInt(r.id.slice(1))), 0) + 1}`;
    setReserve([...reserve, { id: newId, surname: newReserveName.trim(), color: 'blue', counter: 0 }]);
    setNewReserveName('');
    setIsAddingToReserve(false);
  };

  const handleAddToWeekend = () => {
    if (!newWeekendName.trim()) return;
    
    const newId = `w${Math.max(...weekend.map(w => parseInt(w.id.slice(1))), 0) + 1}`;
    setWeekend([...weekend, { id: newId, surname: newWeekendName.trim(), color: 'blue', counter: 0 }]);
    setNewWeekendName('');
    setIsAddingToWeekend(false);
  };

  const handleAddToOtherJobs = () => {
    if (!newOtherJobsName.trim()) return;
    
    const newId = `o${Math.max(...otherJobs.map(o => parseInt(o.id.slice(1))), 0) + 1}`;
    setOtherJobs([...otherJobs, { id: newId, surname: newOtherJobsName.trim(), color: 'blue', counter: 0 }]);
    setNewOtherJobsName('');
    setIsAddingToOtherJobs(false);
  };

  const handleEdit = (id: string, field: string, currentValue: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  };

  const handleSave = () => {
    if (!editingCell) return;
    
    setWeekend(weekend.map(item => {
      if (item.id === editingCell.id) {
        return { ...item, [editingCell.field]: editValue };
      }
      return item;
    }));
    
    setOtherJobs(otherJobs.map(item => {
      if (item.id === editingCell.id) {
        return { ...item, [editingCell.field]: editValue };
      }
      return item;
    }));
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };



  const handleUnlinkReserve = (id: string) => {
    const item = reserve.find(r => r.id === id);
    if (item?.linkedId) {
      setReserve(reserve.map(r => {
        if (r.id === id || r.id === item.linkedId) {
          const { linkedId, ...rest } = r;
          return rest;
        }
        return r;
      }));
    }
  };

  const handleLinkItems = (source: 'reserve' | 'weekend' | 'otherJobs', id: string) => {
    if (!linkingMode) {
      setLinkingMode({ source, id });
      return;
    }

    if (linkingMode.source !== source) {
      setLinkingMode(null);
      return;
    }

    if (linkingMode.id === id) {
      setLinkingMode(null);
      return;
    }

    if (source === 'reserve') {
      const firstItem = reserve.find(r => r.id === linkingMode.id);
      const secondItem = reserve.find(r => r.id === id);
      
      if (firstItem?.linkedId || secondItem?.linkedId) {
        setLinkingMode(null);
        return;
      }

      setReserve(reserve.map(r => {
        if (r.id === linkingMode.id) return { ...r, linkedId: id };
        if (r.id === id) return { ...r, linkedId: linkingMode.id };
        return r;
      }));
    } else if (source === 'weekend') {
      const firstItem = weekend.find(w => w.id === linkingMode.id);
      const secondItem = weekend.find(w => w.id === id);
      
      if (firstItem?.linkedId || secondItem?.linkedId) {
        setLinkingMode(null);
        return;
      }

      setWeekend(weekend.map(w => {
        if (w.id === linkingMode.id) return { ...w, linkedId: id };
        if (w.id === id) return { ...w, linkedId: linkingMode.id };
        return w;
      }));
    } else if (source === 'otherJobs') {
      const firstItem = otherJobs.find(o => o.id === linkingMode.id);
      const secondItem = otherJobs.find(o => o.id === id);
      
      if (firstItem?.linkedId || secondItem?.linkedId) {
        setLinkingMode(null);
        return;
      }

      setOtherJobs(otherJobs.map(o => {
        if (o.id === linkingMode.id) return { ...o, linkedId: id };
        if (o.id === id) return { ...o, linkedId: linkingMode.id };
        return o;
      }));
    }

    setLinkingMode(null);
  };

  const filteredReserve = reserve.filter(item => {
    const hasMatch = item.surname.toLowerCase().includes(searchQuery.toLowerCase());
    const isLinkedSecond = item.linkedId && reserve.find(r => r.id === item.linkedId && r.id < item.id);
    return hasMatch && !isLinkedSecond;
  });

  const filteredWeekend = weekend.filter(item => {
    const hasMatch = item.surname.toLowerCase().includes(searchQuery.toLowerCase());
    const isLinkedSecond = item.linkedId && weekend.find(w => w.id === item.linkedId && w.id < item.id);
    return hasMatch && !isLinkedSecond;
  });

  const filteredOtherJobs = otherJobs.filter(item => {
    const hasMatch = item.surname.toLowerCase().includes(searchQuery.toLowerCase());
    const isLinkedSecond = item.linkedId && otherJobs.find(o => o.id === item.linkedId && o.id < item.id);
    return hasMatch && !isLinkedSecond;
  });

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

  const handleDropToTable = (dataSet: TableRow[], setDataSet: (data: TableRow[]) => void, targetId: string, toSecondCell: boolean = false) => {
    if (!draggedId) return;

    if (draggedFromReserve && draggedItem) {
      const draggedReserveItem = reserve.find(r => r.id === draggedId);
      
      if (draggedReserveItem?.linkedId) {
        const linkedItem = reserve.find(r => r.id === draggedReserveItem.linkedId);
        
        if (linkedItem) {
          setDataSet(dataSet.map(row => 
            row.id === targetId 
              ? { ...row, surname: draggedItem.surname, color: draggedItem.color, counter: draggedReserveItem.counter || 0, surname2: linkedItem.surname, color2: linkedItem.color, counter2: linkedItem.counter || 0 }
              : row
          ));
          setReserve(reserve.filter(r => r.id !== draggedId && r.id !== draggedReserveItem.linkedId));
        } else {
          setDataSet(dataSet.map(row => 
            row.id === targetId 
              ? toSecondCell 
                ? { ...row, surname2: draggedItem.surname, color2: draggedItem.color, counter2: draggedReserveItem.counter || 0 }
                : { ...row, surname: draggedItem.surname, color: draggedItem.color, counter: draggedReserveItem.counter || 0 }
              : row
          ));
          setReserve(reserve.filter(r => r.id !== draggedId));
        }
      } else {
        setDataSet(dataSet.map(row => 
          row.id === targetId 
            ? toSecondCell 
              ? { ...row, surname2: draggedItem.surname, color2: draggedItem.color, counter2: draggedReserveItem?.counter || 0 }
              : { ...row, surname: draggedItem.surname, color: draggedItem.color, counter: draggedReserveItem?.counter || 0 }
            : row
        ));
        setReserve(reserve.filter(r => r.id !== draggedId));
      }
    }

    if (draggedFromWeekend && draggedItem) {
      const draggedWeekendItem = weekend.find(w => w.id === draggedId);
      
      if (draggedWeekendItem?.linkedId) {
        const linkedItem = weekend.find(w => w.id === draggedWeekendItem.linkedId);
        
        if (linkedItem) {
          setDataSet(dataSet.map(row => 
            row.id === targetId 
              ? { ...row, surname: draggedItem.surname, color: draggedItem.color, counter: draggedWeekendItem.counter || 0, surname2: linkedItem.surname, color2: linkedItem.color, counter2: linkedItem.counter || 0 }
              : row
          ));
          setWeekend(weekend.filter(w => w.id !== draggedId && w.id !== draggedWeekendItem.linkedId));
        } else {
          setDataSet(dataSet.map(row => 
            row.id === targetId 
              ? toSecondCell 
                ? { ...row, surname2: draggedItem.surname, color2: draggedItem.color, counter2: draggedWeekendItem.counter || 0 }
                : { ...row, surname: draggedItem.surname, color: draggedItem.color, counter: draggedWeekendItem.counter || 0 }
              : row
          ));
          setWeekend(weekend.filter(w => w.id !== draggedId));
        }
      } else {
        setDataSet(dataSet.map(row => 
          row.id === targetId 
            ? toSecondCell 
              ? { ...row, surname2: draggedItem.surname, color2: draggedItem.color, counter2: draggedWeekendItem?.counter || 0 }
              : { ...row, surname: draggedItem.surname, color: draggedItem.color, counter: draggedWeekendItem?.counter || 0 }
            : row
        ));
        setWeekend(weekend.filter(w => w.id !== draggedId));
      }
    }

    if (draggedFromOtherJobs && draggedItem) {
      const draggedOtherJobsItem = otherJobs.find(o => o.id === draggedId);
      
      if (draggedOtherJobsItem?.linkedId) {
        const linkedItem = otherJobs.find(o => o.id === draggedOtherJobsItem.linkedId);
        
        if (linkedItem) {
          setDataSet(dataSet.map(row => 
            row.id === targetId 
              ? { ...row, surname: draggedItem.surname, color: draggedItem.color, counter: draggedOtherJobsItem.counter || 0, surname2: linkedItem.surname, color2: linkedItem.color, counter2: linkedItem.counter || 0 }
              : row
          ));
          setOtherJobs(otherJobs.filter(o => o.id !== draggedId && o.id !== draggedOtherJobsItem.linkedId));
        } else {
          setDataSet(dataSet.map(row => 
            row.id === targetId 
              ? toSecondCell 
                ? { ...row, surname2: draggedItem.surname, color2: draggedItem.color, counter2: draggedOtherJobsItem.counter || 0 }
                : { ...row, surname: draggedItem.surname, color: draggedItem.color, counter: draggedOtherJobsItem.counter || 0 }
              : row
          ));
          setOtherJobs(otherJobs.filter(o => o.id !== draggedId));
        }
      } else {
        setDataSet(dataSet.map(row => 
          row.id === targetId 
            ? toSecondCell 
              ? { ...row, surname2: draggedItem.surname, color2: draggedItem.color, counter2: draggedOtherJobsItem?.counter || 0 }
              : { ...row, surname: draggedItem.surname, color: draggedItem.color, counter: draggedOtherJobsItem?.counter || 0 }
            : row
        ));
        setOtherJobs(otherJobs.filter(o => o.id !== draggedId));
      }
    }

    handleDragEnd();
  };

  return (
    <div className="w-full min-h-screen bg-background p-2">
      <div className="max-w-[1800px] mx-auto mb-2">
        <div className="bg-primary p-2 rounded">
          <div className="relative max-w-md">
            <Icon name="Search" size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-primary-foreground/60" />
            <Input
              type="text"
              placeholder="Поиск по фамилии..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-6 text-xs bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto flex gap-2">
        <SingleTable 
          title="ТАБЛИЦА 1"
          initialData={data1}
          onDataChange={setData1}
          searchQuery={searchQuery}
          onDragFromTable={handleDragFromTable}
          onDragFromTable2={handleDragFromTable2}
          onDropToTable={(targetId, item, fromReserve, draggedId, toSecondCell) => handleDropToTable(data1, setData1, targetId, toSecondCell)}
          draggedId={draggedId}
          dragOverId={dragOverId}
          setDragOverId={setDragOverId}
          onDragEnd={handleDragEnd}
          onReturnToReserve={(surname, color, surname2, color2) => {
            const maxId = Math.max(...reserve.map(r => parseInt(r.id.slice(1))), 0);
            
            if (surname && surname2) {
              const newReserveId1 = `r${maxId + 1}`;
              const newReserveId2 = `r${maxId + 2}`;
              
              const counter1 = Math.min((surnameCounters[surname] || 0) + 1, 9);
              const counter2 = Math.min((surnameCounters[surname2] || 0) + 1, 9);
              setSurnameCounters({...surnameCounters, [surname]: counter1, [surname2]: counter2});
              
              setReserve([
                ...reserve, 
                { id: newReserveId1, surname, color, linkedId: newReserveId2, counter: counter1 },
                { id: newReserveId2, surname: surname2, color: color2 || 'green', linkedId: newReserveId1, counter: counter2 }
              ]);
            } else if (surname) {
              const counter = Math.min((surnameCounters[surname] || 0) + 1, 9);
              setSurnameCounters({...surnameCounters, [surname]: counter});
              setReserve([...reserve, { id: `r${maxId + 1}`, surname, color, counter }]);
            } else if (surname2) {
              const counter = Math.min((surnameCounters[surname2] || 0) + 1, 9);
              setSurnameCounters({...surnameCounters, [surname2]: counter});
              setReserve([...reserve, { id: `r${maxId + 1}`, surname: surname2, color: color2 || 'green', counter }]);
            }
          }}
        />

        <SingleTable 
          title="ТАБЛИЦА 2"
          initialData={data2}
          onDataChange={setData2}
          searchQuery={searchQuery}
          onDragFromTable={handleDragFromTable}
          onDragFromTable2={handleDragFromTable2}
          onDropToTable={(targetId, item, fromReserve, draggedId, toSecondCell) => handleDropToTable(data2, setData2, targetId, toSecondCell)}
          draggedId={draggedId}
          dragOverId={dragOverId}
          setDragOverId={setDragOverId}
          onDragEnd={handleDragEnd}
          onReturnToReserve={(surname, color, surname2, color2) => {
            const maxId = Math.max(...reserve.map(r => parseInt(r.id.slice(1))), 0);
            
            if (surname && surname2) {
              const newReserveId1 = `r${maxId + 1}`;
              const newReserveId2 = `r${maxId + 2}`;
              
              const counter1 = Math.min((surnameCounters[surname] || 0) + 1, 9);
              const counter2 = Math.min((surnameCounters[surname2] || 0) + 1, 9);
              setSurnameCounters({...surnameCounters, [surname]: counter1, [surname2]: counter2});
              
              setReserve([
                ...reserve, 
                { id: newReserveId1, surname, color, linkedId: newReserveId2, counter: counter1 },
                { id: newReserveId2, surname: surname2, color: color2 || 'green', linkedId: newReserveId1, counter: counter2 }
              ]);
            } else if (surname) {
              const counter = Math.min((surnameCounters[surname] || 0) + 1, 9);
              setSurnameCounters({...surnameCounters, [surname]: counter});
              setReserve([...reserve, { id: `r${maxId + 1}`, surname, color, counter }]);
            } else if (surname2) {
              const counter = Math.min((surnameCounters[surname2] || 0) + 1, 9);
              setSurnameCounters({...surnameCounters, [surname2]: counter});
              setReserve([...reserve, { id: `r${maxId + 1}`, surname: surname2, color: color2 || 'green', counter }]);
            }
          }}
        />

        <Card 
          className="w-52 shrink-0 overflow-hidden transition-colors resize-x min-w-[180px] max-w-[400px]"
          style={{ 
            boxShadow: isOverReserve ? '0 0 0 3px hsl(var(--accent))' : undefined,
          }}
          onDragOver={handleReserveDragOver}
          onDragLeave={handleReserveDragLeave}
          onDrop={handleDropToReserve}
        >
          <div className="bg-secondary p-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon name="Users" size={14} className="text-secondary-foreground" />
                <h2 className="text-xs font-bold text-secondary-foreground tracking-tight">
                  Резерв
                </h2>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddingToReserve(true)}
                variant="outline"
                className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10 h-5 w-5 p-0"
              >
                <Icon name="UserPlus" size={10} />
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
                  className="flex-1 h-6 text-xs bg-secondary-foreground/10 border-secondary-foreground/20"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleAddToReserve}
                  className="bg-accent hover:bg-accent/90 h-6 w-6 p-0"
                >
                  <Icon name="Check" size={10} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddingToReserve(false);
                    setNewReserveName('');
                  }}
                  className="border-secondary-foreground/20 h-6 w-6 p-0"
                >
                  <Icon name="X" size={10} />
                </Button>
              </div>
            )}
          </div>

          <div className="p-2 space-y-1.5 max-h-[calc(100vh-180px)] overflow-y-auto">
            {filteredReserve.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Icon name="UserX" size={20} className="mx-auto mb-2 opacity-20" />
                <p className="text-[10px]">{searchQuery ? 'Ничего не найдено' : 'Резерв пуст'}</p>
                <p className="text-[10px] mt-0.5">{searchQuery ? 'Попробуйте другой запрос' : 'Перетащите сюда фамилии'}</p>
              </div>
            ) : (
              filteredReserve.map((item) => {
                const linkedItem = item.linkedId ? reserve.find(r => r.id === item.linkedId) : null;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleReserveDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all ${draggedId === item.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className={`border ${colorOptions.find(c => c.value === item.color)?.border} rounded px-2 py-1 ${colorOptions.find(c => c.value === item.color)?.bg} ${colorOptions.find(c => c.value === item.color)?.hover} transition-colors shadow-sm cursor-move flex items-center gap-0.5 flex-1 ${linkingMode?.source === 'reserve' && linkingMode.id === item.id ? 'ring-1 ring-accent' : ''}`}
                      >
                        <Icon name="GripVertical" size={10} className="text-muted-foreground" />
                        <span className={`text-[9px] font-mono font-bold mr-0.5 ${(item.counter || 0) > 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{item.counter || 0}</span>
                        <span className={`${colorOptions.find(c => c.value === item.color)?.text} font-semibold text-[11px]`}>
                          {item.surname}
                        </span>
                      </div>
                      {!linkedItem && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLinkItems('reserve', item.id);
                          }}
                          className={`h-5 w-5 p-0 ${linkingMode?.source === 'reserve' && linkingMode.id === item.id ? 'bg-accent/20' : 'hover:bg-accent/10'}`}
                          title="Связать с другой фамилией"
                        >
                          <Icon name="Link" size={10} className="text-muted-foreground" />
                        </Button>
                      )}
                      {linkedItem && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlinkReserve(item.id);
                            }}
                            className="h-5 w-5 p-0 hover:bg-destructive/10"
                            title="Разорвать связь"
                          >
                            <Icon name="Unlink" size={10} className="text-muted-foreground hover:text-destructive" />
                          </Button>
                          <div className={`border ${colorOptions.find(c => c.value === linkedItem.color)?.border} rounded px-2 py-1 ${colorOptions.find(c => c.value === linkedItem.color)?.bg} transition-colors shadow-sm flex items-center gap-0.5`}>
                            <span className={`text-[9px] font-mono font-bold mr-0.5 ${(linkedItem.counter || 0) > 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{linkedItem.counter || 0}</span>
                            <span className={`${colorOptions.find(c => c.value === linkedItem.color)?.text} font-semibold text-[11px]`}>
                              {linkedItem.surname}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card 
          className="w-52 shrink-0 overflow-hidden transition-colors resize-x min-w-[180px] max-w-[400px]"
          style={{ 
            boxShadow: isOverOtherJobs ? '0 0 0 3px hsl(var(--accent))' : undefined,
          }}
          onDragOver={handleOtherJobsDragOver}
          onDragLeave={handleOtherJobsDragLeave}
          onDrop={handleDropToOtherJobs}
        >
          <div className="bg-blue-100 p-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Briefcase" size={14} className="text-blue-700" />
                <h2 className="text-xs font-bold text-blue-700 tracking-tight">
                  Другие работы
                </h2>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddingToOtherJobs(true)}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-200 h-5 w-5 p-0"
              >
                <Icon name="UserPlus" size={10} />
              </Button>
            </div>

            {isAddingToOtherJobs && (
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Введите фамилию..."
                  value={newOtherJobsName}
                  onChange={(e) => setNewOtherJobsName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddToOtherJobs();
                    if (e.key === 'Escape') {
                      setIsAddingToOtherJobs(false);
                      setNewOtherJobsName('');
                    }
                  }}
                  className="flex-1 h-6 text-xs bg-white border-blue-300"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleAddToOtherJobs}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-6 w-6 p-0"
                >
                  <Icon name="Check" size={10} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddingToOtherJobs(false);
                    setNewOtherJobsName('');
                  }}
                  className="border-blue-300 h-6 w-6 p-0"
                >
                  <Icon name="X" size={10} />
                </Button>
              </div>
            )}
          </div>

          <div className="p-2 space-y-1.5 max-h-[calc(100vh-180px)] overflow-y-auto">
            {filteredOtherJobs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Icon name="BriefcaseX" size={20} className="mx-auto mb-2 opacity-20" />
                <p className="text-[10px]">{searchQuery ? 'Ничего не найдено' : 'Список пуст'}</p>
                <p className="text-[10px] mt-0.5">{searchQuery ? 'Попробуйте другой запрос' : 'Перетащите сюда фамилии'}</p>
              </div>
            ) : (
              filteredOtherJobs.map((item) => {
                const linkedItem = item.linkedId ? otherJobs.find(o => o.id === item.linkedId) : null;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleOtherJobsDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all ${draggedId === item.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className={`flex-1 border ${colorOptions.find(c => c.value === item.color)?.border} rounded px-2 py-1 ${colorOptions.find(c => c.value === item.color)?.bg} ${colorOptions.find(c => c.value === item.color)?.hover} transition-colors shadow-sm cursor-move flex items-center gap-0.5 ${linkingMode?.source === 'otherJobs' && linkingMode.id === item.id ? 'ring-2 ring-accent' : ''}`}
                      >
                        <Icon name="GripVertical" size={10} className="text-muted-foreground" />
                        <span className={`text-[9px] font-mono font-bold mr-1 ${(item.counter || 0) > 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{item.counter || 0}</span>
                        <span className={`${colorOptions.find(c => c.value === item.color)?.text} font-semibold text-[11px]`}>
                          {item.surname}
                        </span>
                      </div>
                      {!linkedItem && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLinkItems('otherJobs', item.id);
                          }}
                          className={`h-5 w-5 p-0 ${linkingMode?.source === 'otherJobs' && linkingMode.id === item.id ? 'bg-accent/20' : 'hover:bg-accent/10'}`}
                          title="Связать с другой фамилией"
                        >
                          <Icon name="Link" size={10} className="text-muted-foreground" />
                        </Button>
                      )}
                      {linkedItem && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              const linkedId = item.linkedId;
                              setOtherJobs(otherJobs.map(o => {
                                if (o.id === item.id || o.id === linkedId) {
                                  const { linkedId: _, ...rest } = o;
                                  return rest;
                                }
                                return o;
                              }));
                            }}
                            className="h-5 w-5 p-0 hover:bg-destructive/10"
                            title="Разорвать связь"
                          >
                            <Icon name="Unlink" size={10} className="text-muted-foreground hover:text-destructive" />
                          </Button>
                          <div className={`border ${colorOptions.find(c => c.value === linkedItem.color)?.border} rounded px-2 py-1 ${colorOptions.find(c => c.value === linkedItem.color)?.bg} transition-colors shadow-sm flex items-center gap-0.5`}>
                            <span className={`text-[9px] font-mono font-bold mr-1 ${(linkedItem.counter || 0) > 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{linkedItem.counter || 0}</span>
                            <span className={`${colorOptions.find(c => c.value === linkedItem.color)?.text} font-semibold text-[11px]`}>
                              {linkedItem.surname}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card 
          className="w-52 shrink-0 overflow-hidden transition-colors resize-x min-w-[180px] max-w-[400px]"
          style={{ 
            boxShadow: isOverWeekend ? '0 0 0 3px hsl(var(--accent))' : undefined,
          }}
          onDragOver={handleWeekendDragOver}
          onDragLeave={handleWeekendDragLeave}
          onDrop={handleDropToWeekend}
        >
          <div className="bg-orange-100 p-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="CalendarOff" size={14} className="text-orange-700" />
                <h2 className="text-xs font-bold text-orange-700 tracking-tight">
                  Выходные
                </h2>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddingToWeekend(true)}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-200 h-5 w-5 p-0"
              >
                <Icon name="UserPlus" size={10} />
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
                  className="flex-1 h-6 text-xs bg-white border-orange-300"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleAddToWeekend}
                  className="bg-orange-500 hover:bg-orange-600 text-white h-6 w-6 p-0"
                >
                  <Icon name="Check" size={10} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddingToWeekend(false);
                    setNewWeekendName('');
                  }}
                  className="border-orange-300 h-6 w-6 p-0"
                >
                  <Icon name="X" size={10} />
                </Button>
              </div>
            )}
          </div>

          <div className="p-2 space-y-1.5 max-h-[calc(100vh-180px)] overflow-y-auto">
            {filteredWeekend.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Icon name="CalendarX" size={20} className="mx-auto mb-2 opacity-20" />
                <p className="text-[10px]">{searchQuery ? 'Ничего не найдено' : 'Список пуст'}</p>
                <p className="text-[10px] mt-0.5">{searchQuery ? 'Попробуйте другой запрос' : 'Перетащите сюда фамилии'}</p>
              </div>
            ) : (
              filteredWeekend.map((item) => {
                const linkedItem = item.linkedId ? weekend.find(w => w.id === item.linkedId) : null;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleWeekendDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all ${draggedId === item.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {editingCell?.id === item.id && editingCell.field === 'surname' ? (
                        <Input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                          }}
                          className="flex-1 h-6 text-xs"
                          autoFocus
                        />
                      ) : (
                        <>
                          <div 
                            onClick={() => handleEdit(item.id, 'surname', item.surname)}
                            className={`flex-1 border ${colorOptions.find(c => c.value === item.color)?.border} rounded px-2 py-1 ${colorOptions.find(c => c.value === item.color)?.bg} ${colorOptions.find(c => c.value === item.color)?.hover} transition-colors shadow-sm cursor-move flex items-center gap-0.5 ${linkingMode?.source === 'weekend' && linkingMode.id === item.id ? 'ring-2 ring-accent' : ''}`}
                          >
                            <Icon name="GripVertical" size={10} className="text-muted-foreground" />
                            <span className={`text-[9px] font-mono font-bold mr-1 ${(item.counter || 0) > 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{item.counter || 0}</span>
                            <span className={`${colorOptions.find(c => c.value === item.color)?.text} font-semibold text-[11px]`}>
                              {item.surname}
                            </span>
                          </div>
                          {!linkedItem && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLinkItems('weekend', item.id);
                              }}
                              className={`h-5 w-5 p-0 ${linkingMode?.source === 'weekend' && linkingMode.id === item.id ? 'bg-accent/20' : 'hover:bg-accent/10'}`}
                              title="Связать с другой фамилией"
                            >
                              <Icon name="Link" size={10} className="text-muted-foreground" />
                            </Button>
                          )}
                          {linkedItem && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const linkedId = item.linkedId;
                                  setWeekend(weekend.map(w => {
                                    if (w.id === item.id || w.id === linkedId) {
                                      const { linkedId: _, ...rest } = w;
                                      return rest;
                                    }
                                    return w;
                                  }));
                                }}
                                className="h-5 w-5 p-0 hover:bg-destructive/10"
                                title="Разорвать связь"
                              >
                                <Icon name="Unlink" size={10} className="text-muted-foreground hover:text-destructive" />
                              </Button>
                              <div className={`border ${colorOptions.find(c => c.value === linkedItem.color)?.border} rounded px-2 py-1 ${colorOptions.find(c => c.value === linkedItem.color)?.bg} transition-colors shadow-sm flex items-center gap-0.5`}>
                                <span className={`text-[9px] font-mono font-bold mr-1 ${(linkedItem.counter || 0) > 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{linkedItem.counter || 0}</span>
                                <span className={`${colorOptions.find(c => c.value === linkedItem.color)?.text} font-semibold text-[11px]`}>
                                  {linkedItem.surname}
                                </span>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DataTable;