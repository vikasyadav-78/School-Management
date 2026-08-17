/**
 * Reusable utility to sort classes in natural numeric order on the frontend.
 * Handles strings, objects with keys (like name, class_name, etc.), and custom extractors.
 * Correctly sorts playgroup, nursery, LKG, UKG, and standard numeric classes.
 */
export const sortClassesNaturally = (classes, keyOrExtractor) => {
  if (!Array.isArray(classes)) return [];
  
  const getClassName = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (typeof keyOrExtractor === "function") return keyOrExtractor(item);
    if (typeof keyOrExtractor === "string") return item[keyOrExtractor] || "";
    // Auto-detect common keys
    return item.name || item.class_name || item.className || item.class || (typeof item === "object" ? String(item) : "");
  };

  // Helper to extract sorting weight info
  const getSortKeyInfo = (item) => {
    const name = getClassName(item).trim().toLowerCase();
    
    // Pre-school classes weights
    if (name.includes("play")) return { isNumeric: false, typeWeight: 0, value: name };
    if (name.includes("nursery")) return { isNumeric: false, typeWeight: 1, value: name };
    if (name.includes("lkg")) return { isNumeric: false, typeWeight: 2, value: name };
    if (name.includes("ukg")) return { isNumeric: false, typeWeight: 3, value: name };

    // Extract digits for standard numeric classes (Class 1, Class 2, Class 10, etc.)
    const match = name.match(/\d+/);
    if (match) {
      return { isNumeric: true, typeWeight: 10, value: parseInt(match[0], 10) };
    }

    // Default weight for other non-numeric text classes
    return { isNumeric: false, typeWeight: 4, value: name };
  };

  return [...classes].sort((a, b) => {
    const infoA = getSortKeyInfo(a);
    const infoB = getSortKeyInfo(b);

    if (infoA.typeWeight !== infoB.typeWeight) {
      return infoA.typeWeight - infoB.typeWeight;
    }

    if (infoA.isNumeric && infoB.isNumeric) {
      return infoA.value - infoB.value;
    }

    // Alphabetic fallback
    return String(infoA.value).localeCompare(String(infoB.value), undefined, { numeric: true, sensitivity: 'base' });
  });
};
