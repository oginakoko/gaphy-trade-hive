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
    <Card className="p-6 bg-black/20">
      <h2 className="text-xl font-bold mb-4">Trade Details</h2>
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
    </Card>
  );
};
