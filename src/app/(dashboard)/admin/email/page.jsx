"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import { FaInbox, FaPaperPlane, FaTrash, FaStar, FaPen } from "react-icons/fa";

export default function EmailPage() {
  const mockEmails = [
    { id: 1, sender: "Registrar Office", subject: "Fall Semester Schedules", time: "10:30 AM", unread: true },
    { id: 2, sender: "Prof. Sarah Jenkins", subject: "Midterm Exam Grades Submission", time: "Yesterday", unread: false },
    { id: 3, sender: "Student Council", subject: "Annual Sports Festival Announcement", time: "May 25", unread: false }
  ];

  return (
    <DashboardLayout>
      <PageHeader 
        title="Email Inbox" 
        subtitle="Communicate with students, teachers, and administrative staff."
        action={<Button size="sm"><FaPen className="mr-1.5" /> Compose</Button>}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white border border-zinc-150 rounded-2xl overflow-hidden shadow-sm">
        {/* Navigation Sidebar */}
        <div className="p-4 border-r border-zinc-100 bg-zinc-50/50 space-y-4">
          <ul className="space-y-1">
            <li>
              <button className="w-full flex items-center justify-between px-3 py-2 bg-violet-50 text-violet-600 rounded-lg text-xs font-bold">
                <span className="flex items-center gap-2"><FaInbox /> Inbox</span>
                <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-[9px]">3</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg text-xs font-medium text-left">
                <FaPaperPlane className="text-zinc-400" /> Sent Mail
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg text-xs font-medium text-left">
                <FaStar className="text-zinc-400" /> Starred
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg text-xs font-medium text-left">
                <FaTrash className="text-zinc-400" /> Trash
              </button>
            </li>
          </ul>
        </div>

        {/* Email List */}
        <div className="lg:col-span-3 divide-y divide-zinc-100">
          {mockEmails.map((email) => (
            <div key={email.id} className={`flex items-center justify-between p-4 hover:bg-zinc-50/50 cursor-pointer ${email.unread ? "bg-violet-50/10 font-semibold" : ""}`}>
              <div className="flex items-center gap-4">
                <FaStar className={`w-3.5 h-3.5 ${email.unread ? "text-amber-400" : "text-zinc-300"}`} />
                <div>
                  <h4 className="text-xs text-zinc-800">{email.sender}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">{email.subject}</p>
                </div>
              </div>
              <span className="text-[10px] text-zinc-400">{email.time}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
