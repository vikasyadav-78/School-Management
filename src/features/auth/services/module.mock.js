import { APP_CONFIG } from "@/constants/appConfig";
import { getMockTeachers } from "@/features/teachers/services/teacher.mock";
import { getMockStudents } from "@/features/students/services/module.mock";

// LocalStorage-backed users database for login/registration state persistence
const getUsersDb = () => {
  if (typeof window === "undefined") {
    return [{ email: "admin@school.com", password: "admin123", name: `${APP_CONFIG.shortName} Administrator` }];
  }
  const users = localStorage.getItem("users_db");
  if (!users) {
    const defaultUsers = [{ email: "admin@school.com", password: "admin123", name: `${APP_CONFIG.shortName} Administrator` }];
    localStorage.setItem("users_db", JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  try {
    return JSON.parse(users);
  } catch (e) {
    return [{ email: "admin@school.com", password: "admin123", name: `${APP_CONFIG.shortName} Administrator` }];
  }
};

const saveUserToDb = (newUser) => {
  if (typeof window === "undefined") return;
  const db = getUsersDb();
  db.push(newUser);
  localStorage.setItem("users_db", JSON.stringify(db));
};

const matchDob = (storedDob, inputPassword) => {
  if (!storedDob || !inputPassword) return false;
  // storedDob is formatted as YYYY-MM-DD (e.g. "2006-04-22")
  const cleanStored = storedDob.replace(/[^0-9]/g, ""); // "20060422"
  const cleanInput = inputPassword.replace(/[^0-9]/g, "");
  
  if (cleanStored === cleanInput) return true;
  
  const parts = storedDob.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const ddMmYyyy = `${day}${month}${year}`; // "22042006"
    if (ddMmYyyy === cleanInput) return true;
  }
  
  return false;
};

export const mockLogin = async (credentials) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const { username, email, password, role } = credentials;
      const loginIdentifier = (username || email || "").trim().toLowerCase();
      
      if (role === "student") {
        const students = getMockStudents();
        const student = students.find(
          (s) => (s.admissionNo || "").toLowerCase() === loginIdentifier && matchDob(s.dob, password)
        );
        if (student) {
          resolve({
            success: true,
            token: `mock-jwt-token-student-${student.id}`,
            user: { id: student.id, name: student.name, email: student.email, role: "student" }
          });
        } else {
          reject(new Error("Invalid Admission Number or Date of Birth"));
        }
      } else if (role === "teacher") {
        const teachers = getMockTeachers();
        const teacher = teachers.find(
          (t) => t.email.toLowerCase() === loginIdentifier && matchDob(t.dob, password)
        );
        if (teacher) {
          resolve({
            success: true,
            token: `mock-jwt-token-teacher-${teacher.email}`,
            user: { id: teacher.id, name: teacher.name, email: teacher.email, role: "teacher" }
          });
        } else {
          reject(new Error("Invalid Email or Date of Birth"));
        }
      } else {
        // Admin role (default)
        const db = getUsersDb();
        const user = db.find(
          (u) => (u.email.toLowerCase() === loginIdentifier || u.email.toLowerCase() === (email || "").trim().toLowerCase()) && u.password === password
        );
        if (user) {
          resolve({
            success: true,
            token: `mock-jwt-token-admin-${user.email}`,
            user: { id: `U-${user.email}`, name: user.name, email: user.email, role: "admin" }
          });
        } else {
          reject(new Error("Invalid email or password"));
        }
      }
    }, 800);
  });
};

export const mockGetMe = async () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let token = "";
      if (typeof window !== "undefined") {
        token = localStorage.getItem("token") || "";
      }
      
      if (!token) {
        reject(new Error("No active session"));
        return;
      }
      
      if (token.startsWith("mock-jwt-token-student-")) {
        const id = token.replace("mock-jwt-token-student-", "");
        const students = getMockStudents();
        const student = students.find((s) => s.id.toLowerCase() === id.toLowerCase());
        if (student) {
          resolve({
            success: true,
            user: { id: student.id, name: student.name, email: student.email, role: "student" }
          });
          return;
        }
      } else if (token.startsWith("mock-jwt-token-teacher-")) {
        const email = token.replace("mock-jwt-token-teacher-", "");
        const teachers = getMockTeachers();
        const teacher = teachers.find((t) => t.email.toLowerCase() === email.toLowerCase());
        if (teacher) {
          resolve({
            success: true,
            user: { id: teacher.id, name: teacher.name, email: teacher.email, role: "teacher" }
          });
          return;
        }
      } else if (token.startsWith("mock-jwt-token-admin-") || (token && token.startsWith("mock-jwt-token-") && !token.includes("-student-") && !token.includes("-teacher-"))) {
        let email = token.replace("mock-jwt-token-admin-", "");
        email = email.replace("mock-jwt-token-", "");
        const db = getUsersDb();
        const user = db.find((u) => u.email.toLowerCase() === email.toLowerCase()) || db[0];
        resolve({
          success: true,
          user: { id: `U-${user.email}`, name: user.name, email: user.email, role: "admin" }
        });
        return;
      }
      
      reject(new Error("No active session"));
    }, 300);
  });
};
