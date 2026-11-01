import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "../lib/utils.js";

export interface DataTableColumn<Row> {
  key: keyof Row & string;
  label: string;
}

export interface DataTableProps<
  Row extends Record<string, string | number | boolean | null>,
> {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  rowKey: keyof Row & string;
  onRowClick?: (row: Row) => void;
  renderActions?: (row: Row) => ReactNode;
  emptyMessage?: string;
  className?: string;
}

function formatCell(value: string | number | boolean | null): string {
  if (value === null) return "—";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return String(value);
}

export function DataTable<
  Row extends Record<string, string | number | boolean | null>,
>({
  columns,
  rows,
  rowKey,
  onRowClick,
  renderActions,
  emptyMessage = "Belum ada data.",
  className,
}: DataTableProps<Row>) {
  return (
    <div className={cn("ql-data-table__scroll", className)}>
      <table className="ql-data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
            {renderActions && <th scope="col">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                className="ql-data-table__empty"
                colSpan={columns.length + (renderActions ? 1 : 0)}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={String(row[rowKey])}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event: KeyboardEvent<HTMLTableRowElement>) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                className={onRowClick ? "ql-data-table__selectable" : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>{formatCell(row[column.key])}</td>
                ))}
                {renderActions && (
                  <td
                    className="ql-data-table__actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {renderActions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
