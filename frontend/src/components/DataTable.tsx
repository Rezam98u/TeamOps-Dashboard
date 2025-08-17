import { useMemo } from 'react'
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

type DataTableProps<T extends object> = {
  columns: ColumnDef<T, unknown>[]
  data: T[]
}

export function DataTable<T extends object>({ columns, data }: DataTableProps<T>) {
  const table = useReactTable<T>({ data, columns, getCoreRowModel: getCoreRowModel() })
  const headerGroups = table.getHeaderGroups()
  const rows = table.getRowModel().rows
  const colCount = useMemo(() => headerGroups[0]?.headers.length ?? 0, [headerGroups])

  return (
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          {headerGroups.map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="text-left px-3 py-2 font-medium">
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-4 text-gray-500" colSpan={colCount}>No data</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-t">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}


