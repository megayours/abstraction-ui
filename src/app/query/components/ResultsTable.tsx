import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAddress } from "@/lib/util";

export interface ResultsTableProps {
  results: string[][];
  isLoading: boolean;
  onQuery: () => void;
  onDateRangeChange: (from: string, to: string) => void;
}

export function ResultsTable({
  results,
  isLoading,
  onDateRangeChange
}: ResultsTableProps) {
  // Calculate the maximum number of accounts in any row
  const maxAccounts = Math.max(...results.map(row => row.length));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">

      {/* <div className="flex gap-4">
        <div className="space-y-2 flex-1">
          <Label htmlFor="from-date">From Date</Label>
          <Input
            id="from-date"
            type="date"
            onChange={(e) => onDateRangeChange(e.target.value, '')}
          />
        </div>
        <div className="space-y-2 flex-1">
          <Label htmlFor="to-date">To Date</Label>
          <Input
            id="to-date"
            type="date"
            onChange={(e) => onDateRangeChange('', e.target.value)}
          />
        </div>
      </div> */}

      {results.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                {Array.from({ length: maxAccounts }, (_, i) => (
                  <th key={i} className="px-4 py-2 text-left">
                    Account {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, index) => (
                <tr key={index} className="border-t">
                  {Array.from({ length: maxAccounts }, (_, i) => (
                    <td key={i} className="px-4 py-2">
                      {formatAddress(row[i]) || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          No results to display. Execute a query to see results.
        </div>
      )}
    </div>
  );
} 