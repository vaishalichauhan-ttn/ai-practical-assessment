import { userRepository } from "../repositories/userRepository.js";
import type { UserSummaryDto } from "../types/user.js";

export const userService = {
  async list(): Promise<UserSummaryDto[]> {
    const users = await userRepository.findAll();
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  },
};
