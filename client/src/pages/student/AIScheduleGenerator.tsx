import React, { useState } from "react";
import StudentLayout from "../../layout/StudentLayout";
import { courseApi } from "../../utils/api";
import { Sparkles, Calendar, Clock, MapPin, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface OptimizedSchedule {
  courses: OptimizedCourse[];
  totalCredits: number;
  dayCount: number;
  uniqueDays: string[];
}

interface OptimizedCourse {
  _id: string;
  code: string;
  name: string;
  day: string;
  time: string;
  room: string;
  credits: number;
  instructor: string;
  group: string;
}

interface AIAdvice {
  summary: string;
  reasoning: string;
  tips: string[];
}

interface ProgressState {
  explored: number;
  bestDayCount: number | null;
  hasBest: boolean;
}

const AIScheduleGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<OptimizedCourse[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<OptimizedSchedule | null>(null);
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1: Selection, 2: Result
  const [progress, setProgress] = useState<ProgressState>({
    explored: 0,
    bestDayCount: null,
    hasBest: false
  });

  const user = JSON.parse(localStorage.getItem("student") || "{}");

  const [recommending, setRecommending] = useState(false);

  const fetchAvailable = async () => {
    try {
      const data = await courseApi.getAllCourses();
      if (data.success) {
        setAvailableCourses(data.courses as any);
      }
    } catch (err) {
      console.error("Failed to fetch courses", err);
    }
  };

  const handleRecommend = async () => {
    setRecommending(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/schedule/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.enrollmentClosed) {
          setError(`Enrollment is currently closed for Year ${user.level} students. The enrollment table is not open for your level.`);
          return;
        }
        throw new Error(errorData.message || 'Failed to get recommendations');
      }
      
      const data = await response.json();
      if (data.success) {
        const codes = data.recommendations.map((c: any) => c.code);
        // Only set unique codes
        setSelectedCourseIds(Array.from(new Set(codes)));
      }
    } catch (err: any) {
      console.error("AI Recommendation failed", err);
      setError(err.message || "Failed to get AI recommendations");
    } finally {
      setRecommending(false);
    }
  };

  React.useEffect(() => {
    fetchAvailable();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setProgress({ explored: 0, bestDayCount: null, hasBest: false });
    try {
      const response = await fetch(`${API_BASE_URL}/api/schedule/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          preferredCourseIds: selectedCourseIds.length > 0 ? selectedCourseIds : undefined
        })
      });

      // Handle non-SSE error responses
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          if (errorData.enrollmentClosed) {
            throw new Error(`Enrollment is currently closed for Year ${user.level} students. The enrollment table is not open for your level.`);
          }
          if (errorData.alreadyAtMax) {
            throw new Error(`You have already enrolled in ${errorData.currentCredits} credits, which is your maximum allowed (${errorData.maxCredits} credits). You cannot add more courses.`);
          }
          throw new Error(errorData.message || 'Failed to generate schedule');
        }
        throw new Error('Failed to generate schedule');
      }

      // Handle Server-Sent Events
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) throw new Error('No response body');

      // Show result step immediately
      setStep(2);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'progress') {
                // Update progress display
                setProgress({
                  explored: data.explored,
                  bestDayCount: data.bestDayCount,
                  hasBest: data.hasBest
                });
              } else if (data.type === 'success') {
                setSchedule(data.schedule);
                setAdvice(data.aiAdvice);
                setError(null);
              } else if (data.type === 'error') {
                setError(data.message || 'An error occurred during optimization');
                setStep(1);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'An unexpected error occurred.');
      setStep(1);
    }
  };

  const toggleCourse = (code: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(code) ? prev.filter(i => i !== code) : [...prev, code]
    );
  };

  const uniqueCourses = Array.from(new Set(availableCourses.map(c => c.code)))
    .map(code => availableCourses.find(c => c.code === code)!);

  const totalSelectedCredits = uniqueCourses
    .filter(c => selectedCourseIds.includes(c.code))
    .reduce((sum, c) => sum + c.credits, 0);

  return (
    <StudentLayout user={user}>
      <div className="p-8 max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4 text-white">
            <Sparkles size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">AI Schedule Optimizer</h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
            Our intelligent algorithm analyzes hundreds of course combinations to find your perfect timetable with the
            <span className="text-indigo-600 font-semibold"> least possible days on campus</span>.
          </p>
        </header>

        {step === 1 && !loading && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Select Your Courses</h2>
                  <p className="text-gray-500 text-sm">Choose the courses you'd like to include in your optimized schedule.</p>
                </div>
                <div className="text-right flex items-center gap-6">
                  <button
                    onClick={handleRecommend}
                    disabled={recommending}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors"
                  >
                    {recommending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    Smart Select with AI
                  </button>

                  <div className="flex flex-col items-end">
                    <span className={`text-2xl font-bold ${totalSelectedCredits < 14 ? 'text-orange-500' : 'text-green-500'}`}>
                      {totalSelectedCredits} <span className="text-sm font-normal text-gray-400">/ 14-19</span>
                    </span>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Total Credits</p>
                  </div>
                </div>
              </div>

              {totalSelectedCredits < 14 && selectedCourseIds.length > 0 && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3 text-orange-700 text-sm">
                  <AlertCircle size={18} />
                  <span>You need at least 14 credits. Please select more courses.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto p-2">
                {uniqueCourses.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">No Courses Available</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">We couldn't find any courses matching your major ({user.major}) and level (Year {user.level}).</p>
                  </div>
                ) : (
                  uniqueCourses.map(course => (
                    <label
                      key={course.code}
                      className={`
                        relative flex items-center p-5 rounded-2xl border-2 transition-all cursor-pointer group
                        ${selectedCourseIds.includes(course.code)
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100'
                          : 'border-gray-100 bg-white hover:border-gray-200'}
                      `}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedCourseIds.includes(course.code)}
                        onChange={() => toggleCourse(course.code)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-indigo-500 uppercase">{course.code}</span>
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold">{course.credits} Cr</span>
                          {availableCourses.filter(c => c.code === course.code).length > 1 && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold">
                              {availableCourses.filter(c => c.code === course.code).length} Groups
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{course.name}</p>
                        <p className="text-xs text-gray-400 mt-1">Multiple sections available - AI will pick the best time for you.</p>
                      </div>
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                        ${selectedCourseIds.includes(course.code)
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-gray-200 bg-white'}
                      `}>
                        {selectedCourseIds.includes(course.code) && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="mt-10 flex items-center justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={selectedCourseIds.length === 0 || totalSelectedCredits < 14}
                  className={`
                    px-12 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-3
                    ${(selectedCourseIds.length > 0 && totalSelectedCredits >= 14)
                      ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none hover:translate-y-0'}
                  `}
                >
                  <Sparkles size={20} />
                  Optimize This Selection
                </button>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-6 text-center">
              <p className="text-indigo-700 text-sm">
                <span className="font-bold">Tip:</span> Select at least 5-6 courses to give the AI enough options to find the best configuration!
              </p>
            </div>
          </div>
        )}

        {step === 2 && loading && (
          <div className="bg-white rounded-3xl shadow-xl p-20 text-center">
            <div className="flex flex-col items-center space-y-8">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#4f46e5" 
                    strokeWidth="2"
                    strokeDasharray={`${Math.min(progress.explored / 100, 100) * 283} 283`}
                    className="transition-all duration-300"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="text-indigo-600 animate-spin mx-auto mb-2" size={32} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">Calculating optimal combinations...</h2>
                <p className="text-gray-500 text-sm max-w-lg">
                  Pruning thousands of invalid schedules to find your best fit.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-indigo-600">
                    {(progress.explored / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-indigo-600 font-medium">Combinations Explored</div>
                </div>
                {progress.hasBest && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {progress.bestDayCount}
                    </div>
                    <div className="text-xs text-green-600 font-medium">Best Days Found</div>
                  </div>
                )}
              </div>

              <div className="w-full max-w-md space-y-2">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                    style={{ width: `${Math.min((progress.explored / 5000) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  This typically takes 5-30 seconds depending on available courses
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-12 text-center max-w-2xl mx-auto">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Schedule Generation Failed</h2>
            <p className="text-red-600 mb-8">{error}</p>
            <button
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        {step === 2 && schedule && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Success Banner */}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-green-800">Optimization Successful!</h3>
                <p className="text-green-700 text-sm">Found a valid schedule with only <span className="font-bold">{schedule.dayCount} days</span> on campus.</p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="ml-auto text-sm font-medium text-green-700 hover:underline"
              >
                Change Selection
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Stats Column */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-500" />
                    Schedule Stats
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Total Credits</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                        {schedule.totalCredits} Cr
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Days on Campus</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                        {schedule.dayCount} Days
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {schedule.uniqueDays.map(day => (
                        <span key={day} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {advice && (
                  <div className="bg-white rounded-3xl shadow-sm border border-indigo-100 p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Sparkles size={48} className="text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      AI Academic Advisor
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-1">Summary</p>
                        <p className="text-sm text-gray-600 italic">"{advice.summary}"</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-1">Strategy</p>
                        <p className="text-sm text-gray-600">{advice.reasoning}</p>
                      </div>
                      <div className="pt-4 border-t border-indigo-50">
                        <p className="text-sm font-bold text-gray-800 mb-2">Tips for Success</p>
                        <ul className="space-y-2">
                          {advice.tips.map((tip, i) => (
                            <li key={i} className="text-xs text-gray-600 flex gap-2">
                              <span className="text-indigo-500 font-bold">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                  {enrolling && (
                    <div className="absolute inset-0 bg-indigo-600/90 backdrop-blur-sm z-10 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={32} />
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-2">Auto-Enroll</h3>
                  <p className="text-indigo-100 text-sm mb-6">
                    Would you like to enroll in all these courses now? This will replace your current selection.
                  </p>
                  {enrollSuccess ? (
                    <div className="bg-green-500 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold">
                      <CheckCircle2 size={18} />
                      Enrolled Successfully
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!schedule) return;
                        setEnrolling(true);
                        try {
                          const courseIds = schedule.courses.map(c => c._id);
                          const res = await courseApi.bulkEnroll(courseIds, true); // replaceExisting: true
                          if (res.success) {
                            setEnrollSuccess(true);
                          } else {
                            throw new Error(res.message);
                          }
                        } catch (err: any) {
                          alert(err.message || "Failed to enroll in some courses.");
                        } finally {
                          setEnrolling(false);
                        }
                      }}
                      className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
                    >
                      Confirm Enrollment
                    </button>
                  )}
                </div>
              </div>

              {/* Courses Column */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xl font-bold text-gray-800 ml-2">Proposed Timetable</h3>
                {schedule.courses.map((course, idx) => (
                  <div
                    key={course._id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center gap-6"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-indigo-500 uppercase tracking-wider">{course.code}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-bold uppercase">{course.credits} Credits</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase">Section {course.group}</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-3">{course.name}</h4>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User size={14} className="text-gray-400" />
                          <span className="truncate">{course.instructor}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{course.room}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:flex-col md:items-end">
                      <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl flex items-center gap-2 font-bold text-sm min-w-[120px] justify-center">
                        <Calendar size={14} />
                        {course.day}
                      </div>
                      <div className="px-3 py-2 bg-gray-50 text-gray-700 rounded-xl flex items-center gap-2 font-bold text-sm min-w-[120px] justify-center">
                        <Clock size={14} />
                        {course.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default AIScheduleGenerator;
