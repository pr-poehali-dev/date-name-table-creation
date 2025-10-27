import React, { useState, useEffect } from 'react';
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
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    if (y < height * 0.7) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const filteredData = initialData.filter(row => 
    row.surname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="flex-1 overflow-hidden resize-x min-w-[300px] max-w-full">
      <div className="bg-secondary p-2">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-bold text-secondary-foreground tracking-tight">
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

      <div className="overflow-x-auto max-h-[calc(100vh-120px)] overflow-y-auto">
        <table className="w-full">
          <tbody className="bg-card divide-y divide-border">
            {(searchQuery ? filteredData : initialData).map((row, index, array) => {
              const isNewDay = index === 0 || array[index - 1].date !== row.date;
              
              return (
                <React.Fragment key={`fragment-${row.id}`}>
                  {isNewDay && (
                    <tr key={`date-${row.date}-${index}`} className="sticky top-0 z-10">
                      <td colSpan={3} className="bg-secondary px-2 py-0.5">
                        <div className="flex items-center gap-1">
                          <Icon name="Calendar" size={10} className="text-secondary-foreground" />
                          <span className="font-semibold text-[9px] text-secondary-foreground">
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
                    className={`transition-all duration-150 ${
                      dragOverId === row.id ? 'bg-accent/30 scale-[1.02] shadow-md' : 'hover:bg-muted/50'
                    } ${draggedId === row.id ? 'opacity-50' : ''}`}
                    onDragOver={(e) => handleDragOver(e, row.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedId) {
                        const draggedRow = initialData.find(r => r.id === draggedId);
                        if (draggedRow) {
                          if (draggedId !== row.id) {
                            const draggedIndex = initialData.findIndex(r => r.id === draggedId);
                            const targetIndex = initialData.findIndex(r => r.id === row.id);
                            
                            const newData = [...initialData];
                            const [removed] = newData.splice(draggedIndex, 1);
                            newData.splice(targetIndex, 0, removed);
                            
                            onDataChange(newData);
                          }
                        } else {
                          onDropToTable(row.id, null, false, draggedId, false);
                        }
                      }
                      onDragEnd();
                    }}
                  >
                    <td className="px-1.5 py-0">
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
                        <div className="text-foreground font-mono font-bold text-[10px]">
                          {row.time}
                        </div>
                      )}
                    </td>
                    <td className="px-1.5 py-0">
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
                            <div className={`border border-${row.color}-500 rounded px-2 py-0.5 bg-${row.color}-50 hover:bg-${row.color}-100 transition-colors shadow-sm flex items-center gap-0.5`}>
                              <span className={`text-[9px] font-mono font-bold ${(row.counter || 1) === 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{row.counter || 1}</span>
                              <span className={`text-${row.color}-700 font-semibold text-[11px]`}>{row.surname || '—'}</span>
                            </div>
                          </div>
                          {row.surname2 && (
                            <div 
                              draggable={!editingCell}
                              onDragStart={(e) => handleDragStart2(e, row.id)}
                              onDragEnd={onDragEnd}
                              className="cursor-move transition-colors font-medium flex items-center gap-1"
                            >
                              <Icon name="GripVertical" size={10} className="text-muted-foreground" />
                              <div className={`border border-${row.color2}-500 rounded px-2 py-0.5 bg-${row.color2}-50 hover:bg-${row.color2}-100 transition-colors shadow-sm flex items-center gap-0.5`}>
                                <span className={`text-[9px] font-mono font-bold ${(row.counter2 || 1) === 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{row.counter2 || 1}</span>
                                <span className={`text-${row.color2}-700 font-semibold text-[11px]`}>{row.surname2}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-1.5 py-0">
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
    const saved = localStorage.getItem('data1');
    if (saved) {
      return JSON.parse(saved);
    }
    const generated = generateThreeDaysData(today, 't1');
    generated[0] = { ...generated[0], surname: 'Иванов', color: 'red', surname2: 'Петров', color2: 'blue' };
    generated[1] = { ...generated[1], surname: 'Петров', color: 'blue', surname2: '', color2: 'green' };
    generated[2] = { ...generated[2], surname: 'Сидоров', color: 'green', surname2: '', color2: 'green' };
    return generated;
  });

  const [data2, setData2] = useState<TableRow[]>(() => {
    const saved = localStorage.getItem('data2');
    if (saved) {
      return JSON.parse(saved);
    }
    const generated = generateThreeDaysData(today, 't2');
    generated[0] = { ...generated[0], surname: 'Кузнецов', color: 'yellow' };
    generated[1] = { ...generated[1], surname: 'Смирнов', color: 'purple' };
    return generated;
  });

  const [reserve, setReserve] = useState<Array<{id: string; surname: string; color: string; linkedId?: string; counter?: number}>>(() => {
    const saved = localStorage.getItem('reserve');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 'r1', surname: 'Алексеев', color: 'red', counter: 1 },
      { id: 'r2', surname: 'Новиков', color: 'blue', counter: 1 },
      { id: 'r3', surname: 'Морозов', color: 'red', linkedId: 'r4', counter: 1 },
      { id: 'r4', surname: 'Петров', color: 'blue', linkedId: 'r3', counter: 1 },
    ];
  });

  const [weekend, setWeekend] = useState<Array<{id: string; surname: string; color: string; linkedId?: string; counter?: number}>>(() => {
    const saved = localStorage.getItem('weekend');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 'w1', surname: 'Сидоров', color: 'blue', counter: 1 },
      { id: 'w2', surname: 'Васильев', color: 'red', counter: 1 },
    ];
  });

  const [otherJobs, setOtherJobs] = useState<Array<{id: string; surname: string; color: string; linkedId?: string; counter?: number}>>(() => {
    const saved = localStorage.getItem('otherJobs');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 'o1', surname: 'Федоров', color: 'red', linkedId: 'o2', counter: 1 },
      { id: 'o2', surname: 'Козлов', color: 'blue', linkedId: 'o1', counter: 1 },
    ];
  });
  
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
  const [newWeekendColor, setNewWeekendColor] = useState('blue');
  const [isAddingToWeekend, setIsAddingToWeekend] = useState(false);
  const [newOtherJobsName, setNewOtherJobsName] = useState('');
  const [isAddingToOtherJobs, setIsAddingToOtherJobs] = useState(false);
  
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{surname: string; color: string} | null>(null);
  const [draggedFromSecond, setDraggedFromSecond] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [surnameCounters, setSurnameCounters] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('surnameCounters');
    if (saved) {
      return JSON.parse(saved);
    }
    return {};
  });
  const [linkingMode, setLinkingMode] = useState<{ source: 'reserve' | 'weekend' | 'otherJobs'; id: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/1d969b76-c527-4ad7-8b02-d60c191e1c38');
        const result = await response.json();
        
        if (result.data && Object.keys(result.data).length > 0) {
          if (result.data.data1) setData1(result.data.data1);
          if (result.data.data2) setData2(result.data.data2);
          if (result.data.reserve) setReserve(result.data.reserve);
          if (result.data.weekend) setWeekend(result.data.weekend);
          if (result.data.otherJobs) setOtherJobs(result.data.otherJobs);
          if (result.data.surnameCounters) setSurnameCounters(result.data.surnameCounters);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await fetch('https://functions.poehali.dev/1d969b76-c527-4ad7-8b02-d60c191e1c38', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              data1,
              data2,
              reserve,
              weekend,
              otherJobs,
              surnameCounters
            }
          })
        });
      } catch (error) {
        console.error('Failed to save data:', error);
      }
    };
    
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [data1, data2, reserve, weekend, otherJobs, surnameCounters]);

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

    if (draggedFromWeekend && draggedItem) {
      const draggedWeekendItem = weekend.find(w => w.id === draggedId);
      const maxId = Math.max(...reserve.map(r => parseInt(r.id.slice(1))), 0);
      
      if (draggedWeekendItem?.linkedId) {
        const linkedItem = weekend.find(w => w.id === draggedWeekendItem.linkedId);
        if (linkedItem) {
          const newReserveId1 = `r${maxId + 1}`;
          const newReserveId2 = `r${maxId + 2}`;
          const counter1 = Math.min((surnameCounters[draggedItem.surname] || 0) + 1, 4);
          const counter2 = Math.min((surnameCounters[linkedItem.surname] || 0) + 1, 4);
          setSurnameCounters({...surnameCounters, [draggedItem.surname]: counter1, [linkedItem.surname]: counter2});
          
          setReserve([
            ...reserve,
            { id: newReserveId1, surname: draggedItem.surname, color: draggedItem.color, counter: counter1, linkedId: newReserveId2 },
            { id: newReserveId2, surname: linkedItem.surname, color: linkedItem.color, counter: counter2, linkedId: newReserveId1 }
          ]);
          setWeekend(weekend.filter(w => w.id !== draggedId && w.id !== draggedWeekendItem.linkedId));
        } else {
          const counter = Math.min((surnameCounters[draggedItem.surname] || 0) + 1, 4);
          setSurnameCounters({...surnameCounters, [draggedItem.surname]: counter});
          setReserve([...reserve, { id: `r${maxId + 1}`, surname: draggedItem.surname, color: draggedItem.color, counter }]);
          setWeekend(weekend.filter(w => w.id !== draggedId));
        }
      } else {
        const newCount = (surnameCounters[draggedItem.surname] || 0) + 1;
        const counter = newCount > 4 ? 1 : newCount;
        setSurnameCounters({...surnameCounters, [draggedItem.surname]: counter});
        setReserve([...reserve, { id: `r${maxId + 1}`, surname: draggedItem.surname, color: draggedItem.color, counter }]);
        setWeekend(weekend.filter(w => w.id !== draggedId));
      }
      
      setDraggedId(null);
      setDraggedItem(null);
      setIsOverReserve(false);
      return;
    }

    if (draggedFromOtherJobs && draggedItem) {
      const draggedOtherJobItem = otherJobs.find(o => o.id === draggedId);
      const maxId = Math.max(...reserve.map(r => parseInt(r.id.slice(1))), 0);
      
      if (draggedOtherJobItem?.linkedId) {
        const linkedItem = otherJobs.find(o => o.id === draggedOtherJobItem.linkedId);
        if (linkedItem) {
          const newReserveId1 = `r${maxId + 1}`;
          const newReserveId2 = `r${maxId + 2}`;
          const newCount1 = (surnameCounters[draggedItem.surname] || 0) + 1;
          const counter1 = newCount1 > 4 ? 1 : newCount1;
          const newCount2 = (surnameCounters[linkedItem.surname] || 0) + 1;
          const counter2 = newCount2 > 4 ? 1 : newCount2;
          setSurnameCounters({...surnameCounters, [draggedItem.surname]: counter1, [linkedItem.surname]: counter2});
          
          setReserve([
            ...reserve,
            { id: newReserveId1, surname: draggedItem.surname, color: draggedItem.color, counter: counter1, linkedId: newReserveId2 },
            { id: newReserveId2, surname: linkedItem.surname, color: linkedItem.color, counter: counter2, linkedId: newReserveId1 }
          ]);
          setOtherJobs(otherJobs.filter(o => o.id !== draggedId && o.id !== draggedOtherJobItem.linkedId));
        } else {
          const newCount = (surnameCounters[draggedItem.surname] || 0) + 1;
          const counter = newCount > 4 ? 1 : newCount;
          setSurnameCounters({...surnameCounters, [draggedItem.surname]: counter});
          setReserve([...reserve, { id: `r${maxId + 1}`, surname: draggedItem.surname, color: draggedItem.color, counter }]);
          setOtherJobs(otherJobs.filter(o => o.id !== draggedId));
        }
      } else {
        const newCount = (surnameCounters[draggedItem.surname] || 0) + 1;
        const counter = newCount > 4 ? 1 : newCount;
        setSurnameCounters({...surnameCounters, [draggedItem.surname]: counter});
        setReserve([...reserve, { id: `r${maxId + 1}`, surname: draggedItem.surname, color: draggedItem.color, counter }]);
        setOtherJobs(otherJobs.filter(o => o.id !== draggedId));
      }
      
      setDraggedId(null);
      setDraggedItem(null);
      setIsOverReserve(false);
      return;
    }

    const draggedRow = [...data1, ...data2].find(row => row.id === draggedId);
    if (draggedRow) {
      const maxId = Math.max(...reserve.map(r => parseInt(r.id.slice(1))), 0);
      
      if (draggedFromSecond && draggedRow.surname2) {
        const newCount = (surnameCounters[draggedRow.surname2] || 0) + 1;
        const counter = newCount > 4 ? 1 : newCount;
        setSurnameCounters({...surnameCounters, [draggedRow.surname2]: counter});
        
        const newReserveId = `r${maxId + 1}`;
        setReserve([...reserve, { id: newReserveId, surname: draggedRow.surname2, color: draggedRow.color2 || 'green', counter }]);
        
        setData1(data1.map(row => row.id === draggedId ? { ...row, surname2: '', color2: 'green', counter2: 0 } : row));
        setData2(data2.map(row => row.id === draggedId ? { ...row, surname2: '', color2: 'green', counter2: 0 } : row));
      } else if (draggedRow.surname) {
        if (draggedRow.surname2) {
          const newReserveId1 = `r${maxId + 1}`;
          const newReserveId2 = `r${maxId + 2}`;
          
          const newCount1 = (surnameCounters[draggedRow.surname] || 0) + 1;
          const counter1 = newCount1 > 4 ? 1 : newCount1;
          const newCount2 = (surnameCounters[draggedRow.surname2] || 0) + 1;
          const counter2 = newCount2 > 4 ? 1 : newCount2;
          setSurnameCounters({...surnameCounters, [draggedRow.surname]: counter1, [draggedRow.surname2]: counter2});
          
          setReserve([
            ...reserve, 
            { id: newReserveId1, surname: draggedRow.surname, color: draggedRow.color, linkedId: newReserveId2, counter: counter1 },
            { id: newReserveId2, surname: draggedRow.surname2, color: draggedRow.color2 || 'green', linkedId: newReserveId1, counter: counter2 }
          ]);
        } else {
          const newCount = (surnameCounters[draggedRow.surname] || 0) + 1;
          const counter = newCount > 4 ? 1 : newCount;
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

    if (draggedFromReserve && draggedItem) {
      const draggedReserveItem = reserve.find(r => r.id === draggedId);
      const newWeekendId = `w${Math.max(...weekend.map(w => parseInt(w.id.slice(1))), 0) + 1}`;
      
      if (draggedReserveItem?.linkedId) {
        const linkedItem = reserve.find(r => r.id === draggedReserveItem.linkedId);
        if (linkedItem) {
          const newWeekendId2 = `w${Math.max(...weekend.map(w => parseInt(w.id.slice(1))), 0) + 2}`;
          setWeekend([
            ...weekend.filter(w => w.surname !== draggedItem.surname && w.surname !== linkedItem.surname),
            { id: newWeekendId, surname: draggedItem.surname, color: draggedItem.color, counter: 0, linkedId: newWeekendId2 },
            { id: newWeekendId2, surname: linkedItem.surname, color: linkedItem.color, counter: 0, linkedId: newWeekendId }
          ]);
          setReserve(reserve.filter(r => r.id !== draggedId && r.id !== draggedReserveItem.linkedId));
        } else {
          setWeekend([...weekend.filter(w => w.surname !== draggedItem.surname), { id: newWeekendId, surname: draggedItem.surname, color: draggedItem.color, counter: 0 }]);
          setReserve(reserve.filter(r => r.id !== draggedId));
        }
      } else {
        setWeekend([...weekend.filter(w => w.surname !== draggedItem.surname), { id: newWeekendId, surname: draggedItem.surname, color: draggedItem.color, counter: 0 }]);
        setReserve(reserve.filter(r => r.id !== draggedId));
      }
      
      setDraggedId(null);
      setDraggedItem(null);
      setIsOverWeekend(false);
      return;
    }

    if (draggedFromOtherJobs && draggedItem) {
      const draggedOtherJobItem = otherJobs.find(o => o.id === draggedId);
      const newWeekendId = `w${Math.max(...weekend.map(w => parseInt(w.id.slice(1))), 0) + 1}`;
      
      if (draggedOtherJobItem?.linkedId) {
        const linkedItem = otherJobs.find(o => o.id === draggedOtherJobItem.linkedId);
        if (linkedItem) {
          const newWeekendId2 = `w${Math.max(...weekend.map(w => parseInt(w.id.slice(1))), 0) + 2}`;
          setWeekend([
            ...weekend.filter(w => w.surname !== draggedItem.surname && w.surname !== linkedItem.surname),
            { id: newWeekendId, surname: draggedItem.surname, color: draggedItem.color, counter: 0, linkedId: newWeekendId2 },
            { id: newWeekendId2, surname: linkedItem.surname, color: linkedItem.color, counter: 0, linkedId: newWeekendId }
          ]);
          setOtherJobs(otherJobs.filter(o => o.id !== draggedId && o.id !== draggedOtherJobItem.linkedId));
        } else {
          setWeekend([...weekend.filter(w => w.surname !== draggedItem.surname), { id: newWeekendId, surname: draggedItem.surname, color: draggedItem.color, counter: 0 }]);
          setOtherJobs(otherJobs.filter(o => o.id !== draggedId));
        }
      } else {
        setWeekend([...weekend.filter(w => w.surname !== draggedItem.surname), { id: newWeekendId, surname: draggedItem.surname, color: draggedItem.color, counter: 0 }]);
        setOtherJobs(otherJobs.filter(o => o.id !== draggedId));
      }
      
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

    if (draggedFromReserve && draggedItem) {
      const draggedReserveItem = reserve.find(r => r.id === draggedId);
      const currentCounter = surnameCounters[draggedItem.surname] || 0;
      const newOtherJobsId = `o${Math.max(...otherJobs.map(o => parseInt(o.id.slice(1))), 0) + 1}`;
      
      if (draggedReserveItem?.linkedId) {
        const linkedItem = reserve.find(r => r.id === draggedReserveItem.linkedId);
        if (linkedItem) {
          const newOtherJobsId2 = `o${Math.max(...otherJobs.map(o => parseInt(o.id.slice(1))), 0) + 2}`;
          const linkedCounter = surnameCounters[linkedItem.surname] || 0;
          setOtherJobs([
            ...otherJobs.filter(o => o.surname !== draggedItem.surname && o.surname !== linkedItem.surname),
            { id: newOtherJobsId, surname: draggedItem.surname, color: draggedItem.color, counter: currentCounter, linkedId: newOtherJobsId2 },
            { id: newOtherJobsId2, surname: linkedItem.surname, color: linkedItem.color, counter: linkedCounter, linkedId: newOtherJobsId }
          ]);
          setReserve(reserve.filter(r => r.id !== draggedId && r.id !== draggedReserveItem.linkedId));
        } else {
          setOtherJobs([...otherJobs.filter(o => o.surname !== draggedItem.surname), { id: newOtherJobsId, surname: draggedItem.surname, color: draggedItem.color, counter: currentCounter }]);
          setReserve(reserve.filter(r => r.id !== draggedId));
        }
      } else {
        setOtherJobs([...otherJobs.filter(o => o.surname !== draggedItem.surname), { id: newOtherJobsId, surname: draggedItem.surname, color: draggedItem.color, counter: currentCounter }]);
        setReserve(reserve.filter(r => r.id !== draggedId));
      }
      
      setDraggedId(null);
      setDraggedItem(null);
      setIsOverOtherJobs(false);
      return;
    }

    if (draggedFromWeekend && draggedItem) {
      const draggedWeekendItem = weekend.find(w => w.id === draggedId);
      const currentCounter = surnameCounters[draggedItem.surname] || 0;
      const newOtherJobsId = `o${Math.max(...otherJobs.map(o => parseInt(o.id.slice(1))), 0) + 1}`;
      
      if (draggedWeekendItem?.linkedId) {
        const linkedItem = weekend.find(w => w.id === draggedWeekendItem.linkedId);
        if (linkedItem) {
          const newOtherJobsId2 = `o${Math.max(...otherJobs.map(o => parseInt(o.id.slice(1))), 0) + 2}`;
          const linkedCounter = surnameCounters[linkedItem.surname] || 0;
          setOtherJobs([
            ...otherJobs.filter(o => o.surname !== draggedItem.surname && o.surname !== linkedItem.surname),
            { id: newOtherJobsId, surname: draggedItem.surname, color: draggedItem.color, counter: currentCounter, linkedId: newOtherJobsId2 },
            { id: newOtherJobsId2, surname: linkedItem.surname, color: linkedItem.color, counter: linkedCounter, linkedId: newOtherJobsId }
          ]);
          setWeekend(weekend.filter(w => w.id !== draggedId && w.id !== draggedWeekendItem.linkedId));
        } else {
          setOtherJobs([...otherJobs.filter(o => o.surname !== draggedItem.surname), { id: newOtherJobsId, surname: draggedItem.surname, color: draggedItem.color, counter: currentCounter }]);
          setWeekend(weekend.filter(w => w.id !== draggedId));
        }
      } else {
        setOtherJobs([...otherJobs.filter(o => o.surname !== draggedItem.surname), { id: newOtherJobsId, surname: draggedItem.surname, color: draggedItem.color, counter: currentCounter }]);
        setWeekend(weekend.filter(w => w.id !== draggedId));
      }
      
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
    setWeekend([{ id: newId, surname: newWeekendName.trim(), color: newWeekendColor, counter: 0 }, ...weekend]);
    setNewWeekendName('');
    setNewWeekendColor('blue');
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

      // Ensure red item is always first
      const isFirstRed = firstItem?.color === 'red';
      const isSecondRed = secondItem?.color === 'red';
      
      if (isSecondRed && !isFirstRed) {
        // Swap: make red item first
        setReserve(reserve.map(r => {
          if (r.id === id) return { ...r, linkedId: linkingMode.id };
          if (r.id === linkingMode.id) return { ...r, linkedId: id };
          return r;
        }));
      } else {
        setReserve(reserve.map(r => {
          if (r.id === linkingMode.id) return { ...r, linkedId: id };
          if (r.id === id) return { ...r, linkedId: linkingMode.id };
          return r;
        }));
      }
    } else if (source === 'weekend') {
      const firstItem = weekend.find(w => w.id === linkingMode.id);
      const secondItem = weekend.find(w => w.id === id);
      
      if (firstItem?.linkedId || secondItem?.linkedId) {
        setLinkingMode(null);
        return;
      }

      // Ensure red item is always first
      const isFirstRed = firstItem?.color === 'red';
      const isSecondRed = secondItem?.color === 'red';
      
      if (isSecondRed && !isFirstRed) {
        // Swap: make red item first
        setWeekend(weekend.map(w => {
          if (w.id === id) return { ...w, linkedId: linkingMode.id };
          if (w.id === linkingMode.id) return { ...w, linkedId: id };
          return w;
        }));
      } else {
        setWeekend(weekend.map(w => {
          if (w.id === linkingMode.id) return { ...w, linkedId: id };
          if (w.id === id) return { ...w, linkedId: linkingMode.id };
          return w;
        }));
      }
    } else if (source === 'otherJobs') {
      const firstItem = otherJobs.find(o => o.id === linkingMode.id);
      const secondItem = otherJobs.find(o => o.id === id);
      
      if (firstItem?.linkedId || secondItem?.linkedId) {
        setLinkingMode(null);
        return;
      }

      // Ensure red item is always first
      const isFirstRed = firstItem?.color === 'red';
      const isSecondRed = secondItem?.color === 'red';
      
      if (isSecondRed && !isFirstRed) {
        // Swap: make red item first
        setOtherJobs(otherJobs.map(o => {
          if (o.id === id) return { ...o, linkedId: linkingMode.id };
          if (o.id === linkingMode.id) return { ...o, linkedId: id };
          return o;
        }));
      } else {
        setOtherJobs(otherJobs.map(o => {
          if (o.id === linkingMode.id) return { ...o, linkedId: id };
          if (o.id === id) return { ...o, linkedId: linkingMode.id };
          return o;
        }));
      }
    }

    setLinkingMode(null);
  };



  const filteredReserve = reserve.filter(item => {
    const hasMatch = item.surname.toLowerCase().includes(searchQuery.toLowerCase());
    if (!hasMatch) return false;
    
    if (!item.linkedId) return true;
    
    const linkedItem = reserve.find(r => r.id === item.linkedId);
    if (!linkedItem) return true;
    
    // Show red first, otherwise show by ID
    if (item.color === 'red' && linkedItem.color !== 'red') return true;
    if (linkedItem.color === 'red' && item.color !== 'red') return false;
    return item.id < linkedItem.id;
  });

  const filteredWeekend = weekend.filter(item => {
    const hasMatch = item.surname.toLowerCase().includes(searchQuery.toLowerCase());
    if (!hasMatch) return false;
    
    if (!item.linkedId) return true;
    
    const linkedItem = weekend.find(w => w.id === item.linkedId);
    if (!linkedItem) return true;
    
    // Show red first, otherwise show by ID
    if (item.color === 'red' && linkedItem.color !== 'red') return true;
    if (linkedItem.color === 'red' && item.color !== 'red') return false;
    return item.id < linkedItem.id;
  });

  const filteredOtherJobs = otherJobs.filter(item => {
    const hasMatch = item.surname.toLowerCase().includes(searchQuery.toLowerCase());
    if (!hasMatch) return false;
    
    if (!item.linkedId) return true;
    
    const linkedItem = otherJobs.find(o => o.id === item.linkedId);
    if (!linkedItem) return true;
    
    // Show red first, otherwise show by ID
    if (item.color === 'red' && linkedItem.color !== 'red') return true;
    if (linkedItem.color === 'red' && item.color !== 'red') return false;
    return item.id < linkedItem.id;
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
        } else {
          setDataSet(dataSet.map(row => 
            row.id === targetId 
              ? toSecondCell 
                ? { ...row, surname2: draggedItem.surname, color2: draggedItem.color, counter2: draggedReserveItem.counter || 0 }
                : { ...row, surname: draggedItem.surname, color: draggedItem.color, counter: draggedReserveItem.counter || 0 }
              : row
          ));
        }
      } else {
        setDataSet(dataSet.map(row => 
          row.id === targetId 
            ? toSecondCell 
              ? { ...row, surname2: draggedItem.surname, color2: draggedItem.color, counter2: draggedReserveItem?.counter || 0 }
              : { ...row, surname: draggedItem.surname, color: draggedItem.color, counter: draggedReserveItem?.counter || 0 }
            : row
        ));
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

    if (!draggedFromReserve && !draggedFromWeekend && !draggedFromOtherJobs && draggedItem) {
      const sourceRow = [...data1, ...data2].find(row => row.id === draggedId);
      const targetRow = [...data1, ...data2].find(row => row.id === targetId);
      const isFromData1 = data1.some(row => row.id === draggedId);
      const isTargetInData1 = data1.some(row => row.id === targetId);
      const isSameTable = (isFromData1 && isTargetInData1) || (!isFromData1 && !isTargetInData1);
      
      if (sourceRow && targetRow) {
        if (draggedFromSecond && sourceRow.surname2) {
          const targetData = toSecondCell 
            ? { surname: targetRow.surname2, color: targetRow.color2, counter: targetRow.counter2 }
            : { surname: targetRow.surname, color: targetRow.color, counter: targetRow.counter };
          
          if (isSameTable) {
            setDataSet(dataSet.map(row => {
              if (row.id === targetId) {
                return toSecondCell 
                  ? { ...row, surname2: sourceRow.surname2, color2: sourceRow.color2 || 'green', counter2: sourceRow.counter2 || 0 }
                  : { ...row, surname: sourceRow.surname2, color: sourceRow.color2 || 'green', counter: sourceRow.counter2 || 0 };
              }
              if (row.id === draggedId) {
                return { ...row, surname2: '', color2: 'green', counter2: 0 };
              }
              return row;
            }));
          } else {
            setDataSet(dataSet.map(row => 
              row.id === targetId 
                ? toSecondCell 
                  ? { ...row, surname2: sourceRow.surname2, color2: sourceRow.color2 || 'green', counter2: sourceRow.counter2 || 0 }
                  : { ...row, surname: sourceRow.surname2, color: sourceRow.color2 || 'green', counter: sourceRow.counter2 || 0 }
                : row
            ));
            
            if (isFromData1) {
              setData1(data1.map(row => 
                row.id === draggedId 
                  ? { ...row, surname2: '', color2: 'green', counter2: 0 }
                  : row
              ));
            } else {
              setData2(data2.map(row => 
                row.id === draggedId 
                  ? { ...row, surname2: '', color2: 'green', counter2: 0 }
                  : row
              ));
            }
          }
        } else if (sourceRow.surname) {
          if (sourceRow.surname2) {
            if (isSameTable) {
              setDataSet(dataSet.map(row => {
                if (row.id === targetId) {
                  return { ...row, surname: sourceRow.surname, color: sourceRow.color, counter: sourceRow.counter || 0, surname2: sourceRow.surname2, color2: sourceRow.color2 || 'green', counter2: sourceRow.counter2 || 0 };
                }
                if (row.id === draggedId) {
                  return { ...row, surname: '', color: 'red', counter: 0, surname2: '', color2: 'green', counter2: 0 };
                }
                return row;
              }));
            } else {
              setDataSet(dataSet.map(row => 
                row.id === targetId 
                  ? { ...row, surname: sourceRow.surname, color: sourceRow.color, counter: sourceRow.counter || 0, surname2: sourceRow.surname2, color2: sourceRow.color2 || 'green', counter2: sourceRow.counter2 || 0 }
                  : row
              ));
              
              if (isFromData1) {
                setData1(data1.map(row => 
                  row.id === draggedId 
                    ? { ...row, surname: '', color: 'red', counter: 0, surname2: '', color2: 'green', counter2: 0 }
                    : row
                ));
              } else {
                setData2(data2.map(row => 
                  row.id === draggedId 
                    ? { ...row, surname: '', color: 'red', counter: 0, surname2: '', color2: 'green', counter2: 0 }
                    : row
                ));
              }
            }
          } else {
            if (isSameTable) {
              setDataSet(dataSet.map(row => {
                if (row.id === targetId) {
                  return toSecondCell 
                    ? { ...row, surname2: sourceRow.surname, color2: sourceRow.color, counter2: sourceRow.counter || 0 }
                    : { ...row, surname: sourceRow.surname, color: sourceRow.color, counter: sourceRow.counter || 0 };
                }
                if (row.id === draggedId) {
                  return { ...row, surname: '', color: 'red', counter: 0, surname2: '', color2: 'green', counter2: 0 };
                }
                return row;
              }));
            } else {
              setDataSet(dataSet.map(row => 
                row.id === targetId 
                  ? toSecondCell 
                    ? { ...row, surname2: sourceRow.surname, color2: sourceRow.color, counter2: sourceRow.counter || 0 }
                    : { ...row, surname: sourceRow.surname, color: sourceRow.color, counter: sourceRow.counter || 0 }
                  : row
              ));
              
              if (isFromData1) {
                setData1(data1.map(row => 
                  row.id === draggedId 
                    ? { ...row, surname: '', color: 'red', counter: 0, surname2: '', color2: 'green', counter2: 0 }
                    : row
                ));
              } else {
                setData2(data2.map(row => 
                  row.id === draggedId 
                    ? { ...row, surname: '', color: 'red', counter: 0, surname2: '', color2: 'green', counter2: 0 }
                    : row
                ));
              }
            }
          }
        }
      }
    }

    handleDragEnd();
  };

  return (
    <div className="w-full h-screen bg-background p-2 overflow-hidden">
      <div className="max-w-full h-full mx-auto flex gap-2">
        <SingleTable 
          title="Уруша"
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
              
              const newCount1 = (surnameCounters[surname] || 0) + 1;
              const counter1 = newCount1 > 4 ? 1 : newCount1;
              const newCount2 = (surnameCounters[surname2] || 0) + 1;
              const counter2 = newCount2 > 4 ? 1 : newCount2;
              setSurnameCounters({...surnameCounters, [surname]: counter1, [surname2]: counter2});
              
              setReserve([
                ...reserve, 
                { id: newReserveId1, surname, color, linkedId: newReserveId2, counter: counter1 },
                { id: newReserveId2, surname: surname2, color: color2 || 'green', linkedId: newReserveId1, counter: counter2 }
              ]);
            } else if (surname) {
              const newCount = (surnameCounters[surname] || 0) + 1;
              const counter = newCount > 4 ? 1 : newCount;
              setSurnameCounters({...surnameCounters, [surname]: counter});
              setReserve([...reserve, { id: `r${maxId + 1}`, surname, color, counter }]);
            } else if (surname2) {
              const newCount = (surnameCounters[surname2] || 0) + 1;
              const counter = newCount > 4 ? 1 : newCount;
              setSurnameCounters({...surnameCounters, [surname2]: counter});
              setReserve([...reserve, { id: `r${maxId + 1}`, surname: surname2, color: color2 || 'green', counter }]);
            }
          }}
        />

        <SingleTable 
          title="Чернышевск"
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
              
              const newCount1 = (surnameCounters[surname] || 0) + 1;
              const counter1 = newCount1 > 4 ? 1 : newCount1;
              const newCount2 = (surnameCounters[surname2] || 0) + 1;
              const counter2 = newCount2 > 4 ? 1 : newCount2;
              setSurnameCounters({...surnameCounters, [surname]: counter1, [surname2]: counter2});
              
              setReserve([
                ...reserve, 
                { id: newReserveId1, surname, color, linkedId: newReserveId2, counter: counter1 },
                { id: newReserveId2, surname: surname2, color: color2 || 'green', linkedId: newReserveId1, counter: counter2 }
              ]);
            } else if (surname) {
              const newCount = (surnameCounters[surname] || 0) + 1;
              const counter = newCount > 4 ? 1 : newCount;
              setSurnameCounters({...surnameCounters, [surname]: counter});
              setReserve([...reserve, { id: `r${maxId + 1}`, surname, color, counter }]);
            } else if (surname2) {
              const newCount = (surnameCounters[surname2] || 0) + 1;
              const counter = newCount > 4 ? 1 : newCount;
              setSurnameCounters({...surnameCounters, [surname2]: counter});
              setReserve([...reserve, { id: `r${maxId + 1}`, surname: surname2, color: color2 || 'green', counter }]);
            }
          }}
        />

        <Card 
          className="w-52 shrink-0 overflow-hidden transition-all duration-200 resize-x min-w-[180px] max-w-[400px]"
          style={{ 
            boxShadow: isOverReserve ? '0 0 0 4px hsl(var(--accent))' : undefined,
            transform: isOverReserve ? 'scale(1.02)' : undefined,
          }}
          onDragOver={handleReserveDragOver}
          onDragLeave={handleReserveDragLeave}
          onDrop={handleDropToReserve}
        >
          <div className="bg-secondary p-2 space-y-2">
            <div className="flex items-center gap-1.5">
              <Icon name="Users" size={14} className="text-secondary-foreground" />
              <h2 className="text-xs font-bold text-secondary-foreground tracking-tight">
                В работе
              </h2>
            </div>
          </div>

          <div className="p-2 space-y-1.5 max-h-[calc(100vh-120px)] overflow-y-auto">
            {filteredReserve.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Icon name="UserX" size={20} className="mx-auto mb-2 opacity-20" />
                <p className="text-[10px]">{searchQuery ? 'Ничего не найдено' : 'Список пуст'}</p>
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
                        className={`border border-${item.color}-500 rounded px-2 py-1 bg-${item.color}-50 hover:bg-${item.color}-100 transition-all duration-200 shadow-sm cursor-move flex items-center gap-0.5 flex-1 hover:scale-105 hover:shadow-md ${linkingMode?.source === 'reserve' && linkingMode.id === item.id ? 'ring-2 ring-accent scale-105' : ''}`}
                      >
                        <Icon name="GripVertical" size={10} className="text-muted-foreground" />
                        <span className={`text-[9px] font-mono font-bold mr-0.5 ${(item.counter || 1) === 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{item.counter || 1}</span>
                        <span className={`text-${item.color}-700 font-semibold text-[11px]`}>
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
                          <div className={`border border-${linkedItem.color}-500 rounded px-2 py-1 bg-${linkedItem.color}-50 transition-all duration-200 shadow-sm flex items-center gap-0.5`}>
                            <span className={`text-[9px] font-mono font-bold mr-0.5 ${(linkedItem.counter || 1) === 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{linkedItem.counter || 1}</span>
                            <span className={`text-${linkedItem.color}-700 font-semibold text-[11px]`}>
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
          className="w-52 shrink-0 overflow-hidden transition-all duration-200 resize-x min-w-[180px] max-w-[400px]"
          style={{ 
            boxShadow: isOverWeekend ? '0 0 0 4px hsl(var(--accent))' : undefined,
            transform: isOverWeekend ? 'scale(1.02)' : undefined,
          }}
          onDragOver={handleWeekendDragOver}
          onDragLeave={handleWeekendDragLeave}
          onDrop={handleDropToWeekend}
        >
          <div className="bg-secondary p-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="CalendarOff" size={14} className="text-secondary-foreground" />
                <h2 className="text-xs font-bold text-secondary-foreground tracking-tight">
                  Отсутствуют
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
              <div className="space-y-2">
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
                      setNewWeekendColor('blue');
                    }
                  }}
                  className="w-full h-6 text-xs bg-white border-orange-300"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Select value={newWeekendColor} onValueChange={setNewWeekendColor}>
                    <SelectTrigger className="h-6 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${option.bg} border ${option.border}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      setNewWeekendColor('blue');
                    }}
                    className="border-orange-300 h-6 w-6 p-0"
                  >
                    <Icon name="X" size={10} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="p-2 space-y-1.5 max-h-[calc(100vh-120px)] overflow-y-auto">
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
                            className={`flex-1 border border-${item.color}-500 rounded px-2 py-1 bg-${item.color}-50 hover:bg-${item.color}-100 transition-all duration-200 shadow-sm cursor-move flex items-center gap-0.5 hover:scale-105 hover:shadow-md ${linkingMode?.source === 'weekend' && linkingMode.id === item.id ? 'ring-2 ring-accent scale-105' : ''}`}
                          >
                            <Icon name="GripVertical" size={10} className="text-muted-foreground" />
                            <span className={`text-[9px] font-mono font-bold mr-1 ${(item.counter || 1) === 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{item.counter || 1}</span>
                            <span className={`text-${item.color}-700 font-semibold text-[11px]`}>
                              {item.surname}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.linkedId) {
                                setWeekend(weekend.filter(w => w.id !== item.id && w.id !== item.linkedId));
                              } else {
                                setWeekend(weekend.filter(w => w.id !== item.id));
                              }
                            }}
                            className="h-5 w-5 p-0 hover:bg-destructive/10"
                            title="Удалить"
                          >
                            <Icon name="Trash2" size={10} className="text-muted-foreground hover:text-destructive" />
                          </Button>
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
                              <div className={`border border-${linkedItem.color}-500 rounded px-2 py-1 bg-${linkedItem.color}-50 transition-all duration-200 shadow-sm flex items-center gap-0.5`}>
                                <span className={`text-[9px] font-mono font-bold mr-1 ${(linkedItem.counter || 1) === 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{linkedItem.counter || 1}</span>
                                <span className={`text-${linkedItem.color}-700 font-semibold text-[11px]`}>
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

        <Card 
          className="w-52 shrink-0 overflow-hidden transition-all duration-200 resize-x min-w-[180px] max-w-[400px]"
          style={{ 
            boxShadow: isOverOtherJobs ? '0 0 0 4px hsl(var(--accent))' : undefined,
            transform: isOverOtherJobs ? 'scale(1.02)' : undefined,
          }}
          onDragOver={handleOtherJobsDragOver}
          onDragLeave={handleOtherJobsDragLeave}
          onDrop={handleDropToOtherJobs}
        >
          <div className="bg-secondary p-2 space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="Briefcase" size={14} className="text-secondary-foreground" />
              <h2 className="text-xs font-bold text-secondary-foreground tracking-tight">
                Другие работы
              </h2>
            </div>
          </div>

          <div className="p-2 space-y-1.5 max-h-[calc(100vh-120px)] overflow-y-auto">
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
                        className={`flex-1 border border-${item.color}-500 rounded px-2 py-1 bg-${item.color}-50 hover:bg-${item.color}-100 transition-all duration-200 shadow-sm cursor-move flex items-center gap-0.5 hover:scale-105 hover:shadow-md ${linkingMode?.source === 'otherJobs' && linkingMode.id === item.id ? 'ring-2 ring-accent scale-105' : ''}`}
                      >
                        <Icon name="GripVertical" size={10} className="text-muted-foreground" />
                        <span className={`text-[9px] font-mono font-bold mr-1 ${(item.counter || 1) === 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{item.counter || 1}</span>
                        <span className={`text-${item.color}-700 font-semibold text-[11px]`}>
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
                          <div className={`border border-${linkedItem.color}-500 rounded px-2 py-1 bg-${linkedItem.color}-50 transition-all duration-200 shadow-sm flex items-center gap-0.5`}>
                            <span className={`text-[9px] font-mono font-bold mr-1 ${(linkedItem.counter || 1) === 4 ? 'text-red-600' : 'text-muted-foreground'}`}>{linkedItem.counter || 1}</span>
                            <span className={`text-${linkedItem.color}-700 font-semibold text-[11px]`}>
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
      </div>

      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-64 shadow-lg">
          <div className="bg-secondary/80 backdrop-blur-sm p-3">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Search" size={14} className="text-secondary-foreground" />
              <h3 className="text-xs font-bold text-secondary-foreground">Поиск</h3>
            </div>
            <div className="relative">
              <Icon name="Search" size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Введите фамилию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            {searchQuery && (
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Найдено в таблицах и блоках</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSearchQuery('')}
                  className="h-5 w-5 p-0"
                  title="Очистить"
                >
                  <Icon name="X" size={10} />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DataTable;