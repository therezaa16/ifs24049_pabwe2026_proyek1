export class UpdateBudget {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  execute({ userId, monthlyBudget }) {
    return this.userRepository.updateBudget(userId, Number(monthlyBudget));
  }
}
