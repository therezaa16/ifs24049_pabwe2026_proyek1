import { GetDashboardSummary } from './application/get-dashboard-summary.js';
import { SqliteDashboardRepository } from './infrastructure/dashboard.repository.js';
import { DashboardController } from './presentation/dashboard.controller.js';
import { createDashboardRouter } from './presentation/dashboard.routes.js';

export const createDashboardModule = ({ db, clock, authenticate, timezoneOffsetMinutes }) => {
  const dashboardRepository = new SqliteDashboardRepository({ db });
  const controller = new DashboardController({
    getDashboardSummary: new GetDashboardSummary({ dashboardRepository, clock, timezoneOffsetMinutes })
  });

  return { router: createDashboardRouter({ controller, authenticate }) };
};
