import React from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Station } from "@/components/Station/Types/Stations";

interface CreditsTabProps {
  stations: Station[];
    setActiveTab: (tab: "dashboard" | "stations" | "userManagement" | "credits") => void;
}

const CreditsTab: React.FC<CreditsTabProps> = ({ stations }) => {
  // collect transactions
  const transactions = stations.flatMap(s =>
  (s.pastSessions || []).map(session => {
    const durationHours =
      (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) /
      (1000 * 60 * 60);

    return {
      stationName: s.name,
      username: session.customerName,
      amount: durationHours * s.hourlyRate,
      date: new Date(session.endTime).toLocaleDateString(),
    };
  })
);

  // total credits
  const totalCredits = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  // group by day
  const dailyCredits: { [key: string]: number } = {};
  transactions.forEach(tx => {
    dailyCredits[tx.date] = (dailyCredits[tx.date] || 0) + tx.amount;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <Card className="p-6 text-center">
        <h2 className="text-2xl font-bold font-gaming text-foreground">TOTAL CREDITS</h2>
        <p className="text-3xl font-gaming text-primary mt-2">₹{totalCredits.toFixed(2)}</p>
      </Card>

      {/* Daily Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold font-gaming mb-4">Daily Breakdown</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Credits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(dailyCredits).map(([date, amount]) => (
              <TableRow key={date}>
                <TableCell>{date}</TableCell>
                <TableCell className="text-right">₹{amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* All Transactions */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold font-gaming mb-4">All Transactions</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Station</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, i) => (
              <TableRow key={i}>
                <TableCell>{tx.stationName}</TableCell>
                <TableCell>{tx.date}</TableCell>
                <TableCell>{tx.username}</TableCell>
                <TableCell className="text-right">₹{tx.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default CreditsTab;