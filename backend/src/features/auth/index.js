import { RegisterUser } from './application/register-user.js';
import { LoginUser } from './application/login-user.js';
import { GetProfile } from './application/get-profile.js';
import { UpdateBudget } from './application/update-budget.js';
import { SqliteUserRepository } from './infrastructure/user.repository.js';
import { createAuthenticate } from '../../core/middleware/auth.middleware.js';
import { AuthController } from './presentation/auth.controller.js';
import { createAuthRouter } from './presentation/auth.routes.js';

export { authSchema } from './infrastructure/auth.schema.js';

export const createAuthModule = ({ db, clock, passwordHasher, tokenService, rateLimiter }) => {
  const userRepository = new SqliteUserRepository({ db, clock });
  const authenticate = createAuthenticate({
    tokenService,
    findUserById: (id) => userRepository.findById(id)
  });

  const controller = new AuthController({
    registerUser: new RegisterUser({ userRepository, passwordHasher, tokenService }),
    loginUser: new LoginUser({ userRepository, passwordHasher, tokenService }),
    getProfile: new GetProfile({ userRepository }),
    updateBudget: new UpdateBudget({ userRepository })
  });

  return {
    router: createAuthRouter({ controller, authenticate, rateLimiter }),
    authenticate,
    userRepository
  };
};
