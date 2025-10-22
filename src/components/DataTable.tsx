import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';

interface TableRow {
  id: string;
  date: string;
  surname: string;
}

export const DataTable = () => {
  const [data, setData] = useState<TableRow[]>([
    { id: '1', date: '2025-01-15', surname: 'Иванов' },
    { id: '2', date: '2025-01-16', surname: 'Петров' },
    { id: '3', date: '2025-01-17', surname: 'Сидоров' },
  ]);
  
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'date' | 'surname' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleEdit = (id: string, field: 'date' | 'surname', currentValue: string) => {
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
    const newId = (Math.max(...data.map(r => parseInt(r.id))) + 1).toString();
    setData([...data, { id: newId, date: new Date().toISOString().split('T')[0], surname: '' }]);
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
          return { ...row, date: targetRow.date };
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
                  Дата
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-foreground uppercase tracking-wider">
                  Фамилия
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-secondary-foreground uppercase tracking-wider w-32">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {data.map((row) => (
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
                    {editingCell?.id === row.id && editingCell.field === 'date' ? (
                      <Input
                        type="date"
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
                        onClick={() => handleEdit(row.id, 'date', row.date)}
                        className="cursor-pointer text-foreground hover:text-accent transition-colors"
                      >
                        {new Date(row.date).toLocaleDateString('ru-RU')}
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
                        className="cursor-move text-foreground hover:text-accent transition-colors font-medium flex items-center gap-2"
                      >
                        <Icon name="GripVertical" size={16} className="text-muted-foreground" />
                        {row.surname || '—'}
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
              ))}
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
