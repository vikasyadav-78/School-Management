let itemsList = [
  { id: "T001", name: "Sarah Jenkins", email: "sarah.j@school.com", dob: "1985-05-10", mobile: "+1 312 555 0192", department: "Computer", gender: "Female", education: "M.Sc", joiningDate: "2020-09-01", status: "Active", profileImage: "https://img.magnific.com/premium-photo/beautiful-indian-teacher_981168-2922.jpg?semt=ais_hybrid&w=740&q=80", address: "742 Evergreen Terrace, Springfield" },
  { id: "T002", name: "David Miller", email: "d.miller@school.com", dob: "1988-08-15", mobile: "+1 312 555 0148", department: "Science", gender: "Male", education: "B.Ed", joiningDate: "2021-02-15", status: "Active", profileImage: "https://img.magnific.com/premium-photo/beautiful-indian-teacher_981168-2922.jpg?semt=ais_hybrid&w=740&q=80", address: "123 Elm Street, Maplewood" },
  { id: "T003", name: "Emily Taylor", email: "e.taylor@school.com", dob: "1990-11-20", mobile: "+1 312 555 0177", department: "Mathematics", gender: "Female", education: "M.Ed", joiningDate: "2022-07-20", status: "Active", profileImage: "https://img.magnific.com/premium-photo/beautiful-indian-teacher_981168-2922.jpg?semt=ais_hybrid&w=740&q=80", address: "456 Oak Avenue, Riverdale" },
  { id: "T004", name: "James Wilson", email: "j.wilson@school.com", dob: "1982-03-25", mobile: "+1 312 555 0134", department: "Social Studies", gender: "Male", education: "M.A", joiningDate: "2023-01-10", status: "Active", profileImage: "https://img.magnific.com/premium-photo/beautiful-indian-teacher_981168-2922.jpg?semt=ais_hybrid&w=740&q=80", address: "789 Pine Road, Lakeside" }
];

export const fetchAll = async (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, data: itemsList.map(i => ({ ...i })), total: itemsList.length });
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
        reject(new Error("Teacher not found"));
      }
    }, 200);
  });
};

export const create = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Dynamic ID auto-generation
      const nextNum = itemsList.length > 0 
        ? Math.max(...itemsList.map(t => parseInt(t.id.replace("T", "")))) + 1 
        : 1;
      const nextId = "T" + String(nextNum).padStart(3, "0");
      const newItem = { 
        id: nextId,
        dob: data.dob || "1990-01-01",
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
        reject(new Error("Teacher not found"));
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
        reject(new Error("Teacher not found"));
      }
    }, 200);
  });
};

export const getMockTeachers = () => itemsList;
