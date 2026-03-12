import Link from "next/link";
import { LeaderboardTable } from "@/src/components/leaderboard-table";

export const metadata = {
  title: "リーダーボード - Speech Arena",
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">リーダーボード</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          評価に戻る
        </Link>
      </div>
      <LeaderboardTable />
    </div>
  );
}
