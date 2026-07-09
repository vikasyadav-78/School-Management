"use client";

import PageHeader from "@/components/common/PageHeader";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaBookOpen } from "react-icons/fa";

export default function TeacherTimetablePage() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const schedule = {
    "Monday": [
      { time: "09:00 - 10:00 AM", subject: "Computer Science", class: "Class 10-A", room: "Lab 2" },
      { time: "11:30 - 12:30 PM", subject: "Programming Lab", class: "Class 11-Sci", room: "Computer Lab 1" },
      { time: "02:00 - 03:00 PM", subject: "Database Systems", class: "Class 12-Com", room: "Room 304" }
    ],
    "Tuesday": [
      { time: "10:15 - 11:15 AM", subject: "Web Development", class: "Class 12-Sci", room: "Lab 2" },
      { time: "01:00 - 02:00 PM", subject: "Computer Science", class: "Class 10-A", room: "Room 102" }
    ],
    "Wednesday": [
      { time: "09:00 - 10:00 AM", subject: "Computer Science", class: "Class 10-A", room: "Lab 2" },
      { time: "11:30 - 12:30 PM", subject: "Programming Lab", class: "Class 11-Sci", room: "Computer Lab 1" }
    ],
    "Thursday": [
      { time: "10:15 - 11:15 AM", subject: "Web Development", class: "Class 12-Sci", room: "Lab 2" },
      { time: "02:00 - 03:00 PM", subject: "Database Systems", class: "Class 12-Com", room: "Room 304" }
    ],
    "Friday": [
      { time: "09:00 - 10:00 AM", subject: "Computer Science", class: "Class 10-A", room: "Lab 2" },
      { time: "01:00 - 02:00 PM", subject: "Pedagogy Discussion", class: "Staff Room", room: "Conference Hall" }
    ],
    "Saturday": [
      { time: "09:30 - 11:00 AM", subject: "Practical Assessment", class: "Class 11/12 Sci", room: "Lab 2" }
    ]
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Teaching Timetable"
        subtitle="View and manage your weekly lecture schedules, assigned subject periods, and lab hours."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map((day) => {
          const periods = schedule[day] || [];
          return (
            <div key={day} className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 pb-3.5 border-b border-zinc-150 mb-4">
                <FaCalendarAlt className="text-violet-500 w-4 h-4" />
                <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">{day}</h3>
              </div>

              {periods.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400 font-semibold">
                  No periods scheduled today.
                </div>
              ) : (
                <div className="space-y-3">
                  {periods.map((p, idx) => (
                    <div key={idx} className="p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl space-y-2 hover:border-violet-300/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 text-[9px] font-bold rounded-md uppercase tracking-wider">
                          {p.time}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                        <FaBookOpen className="text-zinc-400 shrink-0" />
                        {p.subject}
                      </h4>
                      
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold pt-1 border-t border-zinc-100/50">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                          {p.class}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt className="text-zinc-400" />
                          {p.room}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
