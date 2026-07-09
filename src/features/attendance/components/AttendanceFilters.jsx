"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStudentsList } from "@/features/students/redux/studentThunk";

export default function AttendanceFilters({
  selectedDate,
  setSelectedDate,
  selectedClass,
  setSelectedClass,
  selectedSection,
  setSelectedSection,
  selectedStream,
  setSelectedStream
}) {
  const dispatch = useDispatch();
  const { classSummaries } = useSelector((state) => state.students);

  useEffect(() => {
    if (!classSummaries || classSummaries.length === 0) {
      dispatch(fetchStudentsList());
    }
  }, [dispatch, classSummaries]);

  // Determine sections dynamically based on the selected class summary and stream
  const selectedClassInfo = classSummaries.find((c) => c.className === selectedClass);
  const sections = selectedClassInfo
    ? selectedClassInfo.isStreamBased
      ? selectedStream === "Science"
        ? ["A", "B"]
        : ["A"]
      : selectedClassInfo.sections || ["A"]
    : [];

  const handleClassChange = (e) => {
    const cls = e.target.value;
    setSelectedClass(cls);
    
    if (cls === "11" || cls === "12") {
      setSelectedStream("Science");
      setSelectedSection("A");
    } else {
      setSelectedStream("");
      setSelectedSection(cls ? "A" : "");
    }
  };

  const handleStreamChange = (e) => {
    const stm = e.target.value;
    setSelectedStream(stm);
    setSelectedSection("A"); // Reset to A when stream changes
  };

  const showStream = selectedClass === "11" || selectedClass === "12";

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
      {/* Date Filter */}
      <div className="flex-1 w-full">
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Attendance Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
        />
      </div>

      {/* Class Selector */}
      <div className="flex-1 w-full">
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Class
        </label>
        <select
          value={selectedClass}
          onChange={handleClassChange}
          className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
        >
          <option value="">Select Class</option>
          {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
            <option key={c} value={c}>
              Class {c}
            </option>
          ))}
        </select>
      </div>

      {/* Stream Selector (Class 11 & 12) or Section Selector (Other classes) */}
      {showStream ? (
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Academic Stream
          </label>
          <select
            value={selectedStream}
            onChange={handleStreamChange}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          >
            <option value="Science">Science</option>
            <option value="Commerce">Commerce</option>
            <option value="Arts">Arts</option>
          </select>
        </div>
      ) : (
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={!selectedClass}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">Select Section</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
