import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ResultsTableProps {
  results: string[][];
  isLoading: boolean;
  onQuery: () => void;
  onDateRangeChange: (from: string, to: string) => void;
}

export function ResultsTable({
  results,
  isLoading,
  onQuery,
  onDateRangeChange
}: ResultsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Query Results</h3>
        <Button onClick={onQuery} disabled={isLoading}>
          {isLoading ? 'Querying...' : 'Execute Query'}
        </Button>
      </div>

      <div className="flex gap-4">
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
      </div>

      {results.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-2 text-left">Account</th>
                <th className="px-4 py-2 text-left">Balance</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{row[0]}</td>
                  <td className="px-4 py-2">{row[1]}</td>
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