const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White"];
const sectionsList = ["A", "B", "C", "D", "E", "F", "G"];
const parentFirstNames = ["Robert", "William", "David", "Richard", "Thomas", "Charles", "Christopher", "Daniel", "Matthew", "Donald"];
const streamsList = ["Science", "Commerce", "Arts"];

let itemsList = [];
let studentCounter = 1;

function createMockStudent(classNum, section, stream = null) {
  const i = studentCounter++;
  const fName = firstNames[i % firstNames.length];
  const lName = lastNames[(i + 3) % lastNames.length];
  const name = `${fName} ${lName}`;
  const parentName = `${parentFirstNames[i % parentFirstNames.length]} ${lName}`;
  
  const id = `S${String(i).padStart(3, "0")}`;
  const email = `${fName.toLowerCase()}.${lName.toLowerCase()}@school.com`;
  const phone = `+1 555-${String(100 + i).padStart(3, "0")}-${String(4000 + i).slice(-4)}`;
  const status = i % 20 === 0 ? "Inactive" : "Active";
  
  // Set admissionDate after Jan 1st 2026 for half of the records to check new admissions counts
  const admissionDate = i % 2 === 0 ? "2026-05-15" : "2025-09-01";
  
  const birthYear = 2026 - 5 - Number(classNum);
  const dob = `${birthYear}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`;
  const gender = i % 2 === 0 ? "Male" : "Female";

  return {
    id,
    name,
    parentName,
    className: String(classNum),
    section,
    stream,
    gender,
    dob,
    admissionNo: `ADM-2026-${String(i).padStart(3, "0")}`,
    email,
    phone,
    status,
    admissionDate,
    profileImage: "",
    address: `${100 + i} School Lane, Townsville`
  };
}

// 1. Seed Classes 1 to 10 dynamically allocating sections based on 50 students max per section limit
for (let c = 1; c <= 10; c++) {
  let count = 30; // default class size for Class 1-7
  if (c === 10) count = 125; // Class 10: 125 students -> A:50, B:50, C:25
  else if (c === 9) count = 80;  // Class 9: 80 students -> A:50, B:30
  else if (c === 8) count = 45;  // Class 8: 45 students -> A:45
  
  for (let sIdx = 0; sIdx < count; sIdx++) {
    // Dynamic partition: first 50 go to section A, next 50 go to B, etc.
    const sec = sectionsList[Math.floor(sIdx / 50)];
    itemsList.push(createMockStudent(c, sec));
  }
}

// 2. Seed Class 11 and Class 12 with streams (Science, Commerce, Arts) and stream-nested sections
for (let c = 11; c <= 12; c++) {
  const streamCounts = c === 11 
    ? { "Science": 65, "Commerce": 25, "Arts": 40 } // Science: 2 sections (A, B), Commerce: 1 (A), Arts: 1 (A)
    : { "Science": 55, "Commerce": 15, "Arts": 30 }; // Science: 2 sections (A, B), Commerce: 1 (A), Arts: 1 (A)

  Object.entries(streamCounts).forEach(([stream, count]) => {
    for (let sIdx = 0; sIdx < count; sIdx++) {
      const sec = sectionsList[Math.floor(sIdx / 50)];
      itemsList.push(createMockStudent(c, sec, stream));
    }
  });
}

// Compute class summaries based on populated itemsList
export const getClassSummaries = () => {
  const classes = [];
  for (let i = 1; i <= 12; i++) {
    const className = `${i}`;
    const classStudents = itemsList.filter((s) => s.className === className);
    
    const newSts = classStudents.filter((s) => {
      if (!s.admissionDate) return false;
      return new Date(s.admissionDate) >= new Date("2026-01-01");
    });

    if (i === 11 || i === 12) {
      const streams = Array.from(new Set(classStudents.map((s) => s.stream).filter(Boolean)));
      const streamSecs = new Set(classStudents.map((s) => `${s.stream}-${s.section}`));
      const totalSections = streamSecs.size;

      classes.push({
        className,
        isStreamBased: true,
        streams,
        totalSections,
        totalStudents: classStudents.length,
        newStudents: newSts.length,
        existingStudents: classStudents.length - newSts.length,
        classTeachers: totalSections
      });
    } else {
      const uniqueSecs = Array.from(new Set(classStudents.map((s) => s.section))).sort();
      const finalSecs = uniqueSecs.length > 0 ? uniqueSecs : ["A"];
      classes.push({
        className,
        isStreamBased: false,
        sections: finalSecs,
        totalSections: finalSecs.length,
        totalStudents: classStudents.length,
        newStudents: newSts.length,
        existingStudents: classStudents.length - newSts.length,
        classTeachers: finalSecs.length
      });
    }
  }
  return classes;
};

export const fetchAll = async (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const summaries = getClassSummaries();
      resolve({ success: true, data: summaries, total: summaries.length });
    }, 300);
  });
};

export const fetchByClass = async (className) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = itemsList.filter((s) => s.className === className).map(i => ({ ...i }));
      resolve({ success: true, data: filtered, total: filtered.length });
    }, 300);
  });
};

export const fetchById = async (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const found = itemsList.find((i) => i.id === id);
      if (found) {
        resolve({ success: true, data: { ...found } });
      } else {
        reject(new Error("Student not found"));
      }
    }, 200);
  });
};

export const create = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const nextNum = itemsList.length > 0 
        ? Math.max(...itemsList.map(s => parseInt(s.id.replace("S", "")))) + 1 
        : 1;
      const nextId = "S" + String(nextNum).padStart(3, "0");
      const newItem = {
        id: nextId,
        ...data
      };
      itemsList = [newItem, ...itemsList];
      resolve({ success: true, data: { ...newItem } });
    }, 300);
  });
};

export const update = async (id, updatedData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = itemsList.findIndex((i) => i.id === id);
      if (idx !== -1) {
        const { id: _, ...safeData } = updatedData;
        itemsList = itemsList.map((item) =>
          item.id === id ? { ...item, ...safeData } : item
        );
        resolve({ success: true, data: { ...itemsList[idx] } });
      } else {
        reject(new Error("Student not found"));
      }
    }, 300);
  });
};

export const remove = async (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = itemsList.findIndex((i) => i.id === id);
      if (idx !== -1) {
        const deleted = itemsList[idx];
        itemsList = itemsList.filter((i) => i.id !== id);
        resolve({ success: true, data: { ...deleted } });
      } else {
        reject(new Error("Student not found"));
      }
    }, 300);
  });
};

export const getMockStudents = () => itemsList;
