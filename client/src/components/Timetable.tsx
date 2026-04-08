export interface TimetableCourse {
  _id?: string;
  code: string;
  name: string;
  day: string;
  time: string;
  room: string;
  credits: number;
  instructor: string;
}

interface TimetableProps {
  courses: TimetableCourse[];
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00"
];

// Helper to convert time "08:00 - 09:30" or "08:00 – 09:30" into a grid span
const parseTime = (timeStr: string) => {
  try {
    const parts = timeStr.replace('–', '-').split('-');
    if (parts.length !== 2) return { startIdx: 0, span: 0 };
    
    let [startHour, startMin] = parts[0].trim().split(':').map(Number);
    let [endHour, endMin] = parts[1].trim().split(':').map(Number);
    
    // Calculate slots (each hour is 2 slots, e.g. 30 min intervals)
    // Grid starts at 08:00.
    const startOffsetMinutes = (startHour - 8) * 60 + startMin;
    const endOffsetMinutes = (endHour - 8) * 60 + endMin;
    
    // Each row represents 1 hour. We can snap to grid by using percentages or explicit fractional grid units
    const startIdx = startOffsetMinutes / 60;
    const span = (endOffsetMinutes - startOffsetMinutes) / 60;
    
    return { startIdx, span };
  } catch (e) {
    return { startIdx: 0, span: 0 };
  }
};

const colors = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
];

const Timetable: React.FC<TimetableProps> = ({ courses }) => {
  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="min-w-[800px]">
        {/* Header Row: Days */}
        <div className="flex border-b border-gray-200">
          <div className="w-20 flex-shrink-0" /> {/* Empty corner */}
          {DAYS.map(day => (
            <div key={day} className="flex-1 text-center py-3 font-semibold text-gray-700 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Timetable Body */}
        <div className="relative flex">
          {/* Time Column */}
          <div className="w-20 flex-shrink-0 flex flex-col border-r border-gray-200">
            {HOURS.map((hour) => (
              <div key={hour} className="h-20 text-xs text-gray-500 text-right pr-3 pt-2 relative">
                <span className="-top-3 relative">{hour}</span>
              </div>
            ))}
          </div>

          {/* Grid Background */}
          <div className="absolute inset-0 left-20 flex flex-col pointer-events-none">
            {HOURS.map((hour) => (
              <div key={hour} className="h-20 border-t border-gray-100 w-full" />
            ))}
          </div>

          {/* Days Columns */}
          {DAYS.map((day) => {
            const dayCourses = courses.filter(c => c.day === day);
            return (
              <div key={day} className="flex-1 relative h-[720px] border-r border-gray-100 last:border-r-0">
                {dayCourses.map((course, i) => {
                  const { startIdx, span } = parseTime(course.time);
                  if (span <= 0) return null;

                  const colorClass = colors[i % colors.length];

                  return (
                    <div
                      key={course.code}
                      className={`absolute left-1 right-1 rounded-md border-l-4 p-2 overflow-hidden shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md ${colorClass}`}
                      style={{
                        top: `${(startIdx * 80) + 1}px`, // 80px per hour
                        height: `${(span * 80) - 2}px`,
                      }}
                    >
                      <div className="font-bold text-xs leading-tight mb-1">{course.code}</div>
                      <div className="text-[10px] leading-tight opacity-90 line-clamp-2">{course.name}</div>
                      <div className="text-[10px] opacity-75 mt-1 font-medium">{course.room}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timetable;
