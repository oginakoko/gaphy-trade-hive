import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TradeTracking } from '@/hooks/useTradeTracking';

interface TradeTrackingTableProps {
  trades: TradeTracking[];
}

export const TradeTrackingTable = ({ trades }: TradeTrackingTableProps) => {
  if (!trades || trades.length === 0) return null;

  return (
    <Card className="p-6 bg-black/20 overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Trade Details</h2>
      {/* Mobile stacked cards */}
      <div className="flex flex-col gap-4 sm:hidden">
        {trades.map((trade) => (
          <div key={trade.id} className="rounded-lg border border-gray-700 bg-black/40 p-4 flex flex-col gap-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Asset</span>
              <span className="font-medium text-white">{trade.asset}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Direction</span>
              <span className={trade.direction === 'Long' ? 'text-green-500' : 'text-red-500'}>{trade.direction}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Entry</span>
              <span className="text-white">{trade.entry_price || '-'}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Target</span>
              <span className="text-white">{trade.target_price || '-'}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Stop Loss</span>
              <span className="text-white">{trade.stop_loss || '-'}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>R/R</span>
              <span className="text-white">{trade.risk_reward || '-'}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Status</span>
              <span className={
                trade.status === 'open' ? 'text-blue-500' :
                trade.status === 'closed' ? 'text-green-500' : 'text-red-500'
              }>
                {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop table */}
      <div className="w-full min-w-[600px] hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Entry</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Stop Loss</TableHead>
              <TableHead>R/R</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell className="font-medium">{trade.asset}</TableCell>
                <TableCell className={trade.direction === 'Long' ? 'text-green-500' : 'text-red-500'}>
                  {trade.direction}
                </TableCell>
                <TableCell>{trade.entry_price || '-'}</TableCell>
                <TableCell>{trade.target_price || '-'}</TableCell>
                <TableCell>{trade.stop_loss || '-'}</TableCell>
                <TableCell>{trade.risk_reward || '-'}</TableCell>
                <TableCell className={
                  trade.status === 'open' ? 'text-blue-500' :
                  trade.status === 'closed' ? 'text-green-500' : 'text-red-500'
                }>
                  {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
