import {
  buildDailyTrend,
  calculateDisciplineScore,
  calculateMonthlySpending,
  startOfLocalDay,
  startOfLocalMonth,
  summarizeFinancials
} from '../domain/dashboard.calculator.js';

const TREND_DAYS = 7;
const RECENT_LIMIT = 5;

export class GetDashboardSummary {
  constructor({ dashboardRepository, clock, timezoneOffsetMinutes }) {
    this.dashboardRepository = dashboardRepository;
    this.clock = clock;
    this.offsetMinutes = timezoneOffsetMinutes;
  }

  execute({ userId }) {
    const repo = this.dashboardRepository;
    const now = this.clock();
    const windowStart = startOfLocalDay(now, this.offsetMinutes, TREND_DAYS - 1);
    const monthStart = startOfLocalMonth(now, this.offsetMinutes);
    const spendingSince = new Date(Math.min(windowStart.getTime(), monthStart.getTime())).toISOString();

    const buckets = summarizeFinancials(repo.getFinancialTotals(userId));
    const expenseRows = repo.getSpendingRows(userId, spendingSince);
    const studyRows = repo.getStudyRows(userId, windowStart.toISOString());
    const categories = repo.getCategorySpending(userId, monthStart.toISOString());

    const monthlyBudget = repo.getMonthlyBudget(userId);
    const monthlySpending = calculateMonthlySpending({ now, offsetMinutes: this.offsetMinutes, expenseRows });
    const activeExpenses = buckets.needs.amount + buckets.wantsUnlocked.amount;

    return {
      financial: {
        totalIncome: buckets.income.amount,
        totalNeeds: buckets.needs.amount,
        totalWantsUnlocked: buckets.wantsUnlocked.amount,
        totalWantsLocked: buckets.wantsLocked.amount,
        totalWantsCancelled: buckets.wantsCancelled.amount,
        totalActiveExpenses: activeExpenses,
        activeBalance: buckets.income.amount - activeExpenses,
        monthlyBudget,
        monthlySpending,
        remainingBudget: monthlyBudget > 0 ? monthlyBudget - monthlySpending : null,
        disciplineScore: calculateDisciplineScore(buckets),
        counts: {
          income: buckets.income.count,
          needs: buckets.needs.count,
          wantsUnlocked: buckets.wantsUnlocked.count,
          wantsLocked: buckets.wantsLocked.count,
          wantsCancelled: buckets.wantsCancelled.count
        }
      },
      study: repo.getMissionStats(userId),
      charts: {
        allocation: {
          labels: ['Kebutuhan', 'Keinginan terbuka', 'Keinginan terkunci', 'Dibatalkan (hemat)'],
          data: [
            buckets.needs.amount,
            buckets.wantsUnlocked.amount,
            buckets.wantsLocked.amount,
            buckets.wantsCancelled.amount
          ]
        },
        categorySpending: {
          labels: categories.map((row) => row.category),
          data: categories.map((row) => Number(row.total))
        },
        weeklyTrends: buildDailyTrend({
          now,
          offsetMinutes: this.offsetMinutes,
          days: TREND_DAYS,
          expenseRows,
          studyRows
        })
      },
      recent: {
        transactions: repo.getRecentTransactions(userId, RECENT_LIMIT),
        missions: repo.getRecentMissions(userId, RECENT_LIMIT)
      }
    };
  }
}
