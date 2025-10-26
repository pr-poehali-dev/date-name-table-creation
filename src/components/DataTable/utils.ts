import type { ColorOption, TableRow } from './types';

export const colorOptions: ColorOption[] = [
  { value: 'red', label: 'Красный', border: 'border-red-500', bg: 'bg-red-50', hover: 'hover:bg-red-100', text: 'text-red-700' },
  { value: 'blue', label: 'Синий', border: 'border-blue-500', bg: 'bg-blue-50', hover: 'hover:bg-blue-100', text: 'text-blue-700' },
];

export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
};

export const generateThreeDaysData = (prefix: string): TableRow[] => {
  const data: TableRow[] = [];
  const today = new Date();
  
  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + dayOffset);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        data.push({
          id: `${prefix}-${dateStr}-${time}`,
          date: dateStr,
          time,
          surname: '',
          color: 'red',
          surname2: '',
          color2: 'green'
        });
      }
    }
  }
  
  return data;
};
