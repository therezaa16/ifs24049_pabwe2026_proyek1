export class DashboardController {
  constructor({ getDashboardSummary }) {
    this.getDashboardSummary = getDashboardSummary;
  }

  summary = async (req, res) => {
    const data = this.getDashboardSummary.execute({ userId: req.user.id });
    res.status(200).json({ success: true, data });
  };
}
