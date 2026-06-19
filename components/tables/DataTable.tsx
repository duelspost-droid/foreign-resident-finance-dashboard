import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  header: string;
  accessor: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
};

export function DataTable<T>({
  columns,
  rows,
  rowKey
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}) {
  return (
    <div className="table-scroll">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
            {columns.map((column) => (
              <th
                className={`px-4 py-3 font-semibold ${
                  column.align === "right"
                    ? "text-right"
                    : column.align === "center"
                      ? "text-center"
                      : "text-left"
                }`}
                key={column.header}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-8 text-center text-sm text-muted" colSpan={columns.length}>
                표시할 데이터가 없습니다.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr className="border-b border-slate-100 last:border-0" key={rowKey(row)}>
              {columns.map((column) => (
                <td
                  className={`px-4 py-3 text-slate-800 ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                  key={column.header}
                >
                  {column.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
