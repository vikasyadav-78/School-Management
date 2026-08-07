"use client";

import Loader from "../ui/Loader";
import Pagination from "../ui/Pagination";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  totalCount = 0,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  emptyMessage = "No records found."
}) {
  return (
    <div className="bg-white border border-zinc-150 rounded-2xl overflow-hidden shadow-sm">
      {/* Table Frame */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-100 text-left">
          <thead className="bg-zinc-50">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 bg-white">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (onView || onEdit || onDelete ? 1 : 0)}
                  className="py-12"
                >
                  <Loader size="md" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onView || onEdit || onDelete ? 1 : 0)}
                  className="px-6 py-10 text-center text-xs font-medium text-zinc-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-zinc-50/50 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-xs text-zinc-700">
                      {col.render ? col.render(row, rowIdx) : row[col.accessor]}
                    </td>
                  ))}

                  {/* Actions Column */}
                  {(onView || onEdit || onDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-1.5">
                      {onView && (
                        <button
                          onClick={() => onView(row)}
                          className="bg-zinc-50 hover:bg-zinc-100 text-zinc-600 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border border-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                          title="View"
                        >
                          <FaEye className="w-3.5 h-3.5" /> View
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="inline-flex p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="inline-flex p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination component */}
      {!loading && totalCount > 0 && onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
