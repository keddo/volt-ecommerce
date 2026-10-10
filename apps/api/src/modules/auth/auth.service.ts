import bcrypt from "bcryptjs";
import type { LoginInput, RegisterInput } from "@personal-ecommerce/shared";
import { Role } from "@personal-ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";
import {
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
  signAccessToken,
} from "../../lib/tokens";

const SALT_ROUNDS = 12;

function toAuthUser(user: { id: string; name: string; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role as Role };
}

export async function registerCustomer(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  return issueSession(user.id, user.role as Role, toAuthUser(user));
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid email or password");
  }

  return issueSession(user.id, user.role as Role, toAuthUser(user));
}

async function issueSession(userId: string, role: Role, authUser: ReturnType<typeof toAuthUser>) {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken, refreshToken, user: authUser };
}

export async function refreshSession(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new HttpError(401, "Missing refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new HttpError(401, "Refresh token is invalid or expired");
  }

  // Rotate: revoke the used token and issue a new one so a stolen token can't be replayed indefinitely.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueSession(stored.userId, stored.user.role as Role, toAuthUser(stored.user));
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;

  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return toAuthUser(user);
}

export async function updateProfile(userId: string, name: string) {
  const user = await prisma.user.update({ where: { id: userId }, data: { name } });
  return toAuthUser(user);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "User not found");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new HttpError(401, "Current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  // Force re-login on every other session - the same revocation mechanism logout() uses - but
  // keep this device signed in by issuing it a fresh session rather than also revoking itself.
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return issueSession(user.id, user.role as Role, toAuthUser(user));
}
