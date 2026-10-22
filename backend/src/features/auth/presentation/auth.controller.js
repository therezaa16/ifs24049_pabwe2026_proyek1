export class AuthController {
  constructor({ registerUser, loginUser, getProfile, updateBudget }) {
    this.registerUser = registerUser;
    this.loginUser = loginUser;
    this.getProfile = getProfile;
    this.updateBudget = updateBudget;
  }

  register = async (req, res) => {
    const { token, user } = await this.registerUser.execute(req.body);
    res.status(201).json({ success: true, message: 'Registrasi berhasil', token, user });
  };

  login = async (req, res) => {
    const { token, user } = await this.loginUser.execute(req.body);
    res.status(200).json({ success: true, message: 'Login berhasil', token, user });
  };

  me = async (req, res) => {
    const user = this.getProfile.execute({ userId: req.user.id });
    res.status(200).json({ success: true, user });
  };

  setBudget = async (req, res) => {
    const user = this.updateBudget.execute({
      userId: req.user.id,
      monthlyBudget: req.body.monthly_budget
    });
    res.status(200).json({ success: true, message: 'Anggaran bulanan berhasil diperbarui', user });
  };
}
