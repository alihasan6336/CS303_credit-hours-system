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
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM", "08:00 PM"
];

const parseTime = (timeStr: string) => {
  try {
    const parts = timeStr.replace('–', '-').split('-');
    if (parts.length !== 2) return { startIdx: 0, span: 0 };
    
    const parseHourMinute = (s: string) => {
      const clean = s.trim().toUpperCase();
      const isPM = clean.includes("PM");
      const isAM = clean.includes("AM");
      let [h, m] = clean.replace(/AM|PM/, "").trim().split(":").map(Number);
      
      if (isPM && h !== 12) h += 12;
      if (isAM && h === 12) h = 0;
      
      return h + m / 60;
    };
    
    const startTimeDecimal = parseHourMinute(parts[0]);
    const endTimeDecimal = parseHourMinute(parts[1]);
    
    // Grid starts at 08:00 AM
    const startIdx = startTimeDecimal - 8;
    const span = endTimeDecimal - startTimeDecimal;
    
    return { startIdx, span };
  } catch (e) {
    console.error("Timetable parse error:", e);
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
              <div key={hour} className="h-20 text-[11px] font-bold text-gray-500 text-right pr-3 pt-2 relative">
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
              <div key={day} className="flex-1 relative h-[1040px] border-r border-gray-100 last:border-r-0">
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
                      <div className="font-bold text-sm leading-tight mb-1">{course.code}</div>
                      <div className="text-xs leading-tight opacity-95 line-clamp-2">{course.name}</div>
                      <div className="text-xs opacity-80 mt-1 font-bold">{course.room}</div>
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
