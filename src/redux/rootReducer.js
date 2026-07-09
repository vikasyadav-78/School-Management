import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/redux/moduleSlice";
import teachersReducer from "@/features/teachers/redux/teacherSlice";
import studentsReducer from "@/features/students/redux/studentSlice";
import attendanceReducer from "@/features/attendance/redux/attendanceSlice";
import financeReducer from "@/features/finance/redux/financeSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  teachers: teachersReducer,
  students: studentsReducer,
  attendance: attendanceReducer,
  finance: financeReducer,
});

export default rootReducer;
