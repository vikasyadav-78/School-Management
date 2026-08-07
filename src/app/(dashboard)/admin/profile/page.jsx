"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import { APP_CONFIG } from "@/constants/appConfig";
import Button from "@/components/ui/Button";
import { FaUser, FaEnvelope, FaShieldAlt, FaMapMarkerAlt, FaBriefcase } from "react-icons/fa";
import { useAppDialog } from "@/context/DialogContext";

export default function ProfilePage() {
  const dialog = useAppDialog();
  return (
    <DashboardLayout>
      <PageHeader 
        title="Admin Profile" 
        subtitle="Manage your personal profile and account credentials."
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm text-center">
          <div className="w-24 h-24 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-3xl mx-auto shadow-inner mb-4">
            E
          </div>
          <h3 className="text-base font-bold text-zinc-800">{APP_CONFIG.shortName} Administrator</h3>
          <p className="text-xs text-zinc-400 mt-1">Super User / Dean</p>
          <div className="flex justify-center gap-1.5 mt-4">
            <span className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-semibold">Active</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">Verified</span>
          </div>
          
          <div className="border-t border-zinc-100 my-6 pt-6 text-left space-y-4 text-xs text-zinc-600">
            <div className="flex items-center gap-3">
              <FaBriefcase className="text-zinc-400" />
              <span>{APP_CONFIG.schoolName} Administration</span>
            </div>
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt className="text-zinc-400" />
              <span>JAIPUR</span>
            </div>
            <div className="flex items-center gap-3">
              <FaEnvelope className="text-zinc-400" />
              <span>admin@school.com</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-50 pb-3">Personal Credentials</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-black font-semibold">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">First Name</label>
              <input type="text" defaultValue={APP_CONFIG.shortName} className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-xs outline-none bg-zinc-50 focus:bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Last Name</label>
              <input type="text" defaultValue="Administrator" className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-xs outline-none bg-zinc-50 focus:bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Email Address</label>
              <input type="email" defaultValue="admin@school.com" className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-xs outline-none bg-zinc-50 focus:bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500">Contact Number</label>
              <input type="text" defaultValue="+1 312 555 0100" className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-xs outline-none bg-zinc-50 focus:bg-white" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button size="sm" onClick={() => dialog.alert({ title: "Profile Settings", message: "Credentials saved successfully!", type: "success" })}>Save Changes</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
