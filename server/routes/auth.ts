import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { 
  getUserByEmail, 
  getUserById, 
  createUser, 
  revokeToken, 
  isTokenRevoked 
} from "../db/firebase";

export const authRouter = Router();

// Secret Keys
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "dr-banner-access-super-secret-key-123";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "dr-banner-refresh-super-secret-key-456";

// Dummy export to prevent import errors in other modules before full refactor
export const usersDb = {
  get: () => null,
  has: () => false,
  set: () => {},
  delete: () => {},
  values: () => []
} as any;

// Helper to generate tokens
export const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// --- AUTHENTICATION ENDPOINTS ---

// 1. REGISTER
authRouter.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Email, password, and display name are required"
        }
      });
      return;
    }

    // Check existing in Firestore
    const existing = await getUserByEmail(email);
    if (existing) {
      res.status(409).json({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "The email address is already registered on this platform"
        }
      });
      return;
    }

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = `usr_${Math.random().toString(36).substring(2, 11)}`;

    const newUser = {
      email: email.toLowerCase(),
      passwordHash,
      displayName,
      role: "candidate" as const
    };

    await createUser(userId, newUser);

    // Generate credentials tokens
    const { accessToken, refreshToken } = generateTokens({
      id: userId,
      email: newUser.email,
      role: newUser.role
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userId,
          email: newUser.email,
          displayName: newUser.displayName,
          role: newUser.role,
          createdAt: new Date()
        },
        accessToken,
        refreshToken
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Math.random().toString(36).substring(2, 15)}`
      }
    });

  } catch (error: any) {
    console.error("Auth registration error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred during user registration"
      }
    });
  }
});

// 2. LOGIN
authRouter.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Email and password are required"
        }
      });
      return;
    }

    // Lookup user in Firestore
    const user = await getUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email address or password"
        }
      });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email address or password"
        }
      });
      return;
    }

    // Tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Set HTTPOnly cookie for production-grade security refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          photoUrl: user.photoUrl || null
        },
        accessToken,
        refreshToken
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Math.random().toString(36).substring(2, 15)}`
      }
    });

  } catch (error) {
    console.error("Auth login error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Authentication failed"
      }
    });
  }
});

// 3. REFRESH TOKEN
authRouter.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_REQUIRED",
          message: "Refresh token is required"
        }
      });
      return;
    }

    // Check if token has been revoked in Firestore
    const revoked = await isTokenRevoked(refreshToken);
    if (revoked) {
      res.status(403).json({
        success: false,
        error: {
          code: "REVOKED_TOKEN",
          message: "This refresh token has been revoked"
        }
      });
      return;
    }

    // Verify Token
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Refresh token is expired or invalid"
          }
        });
      }

      try {
        const userId = decoded.userId;
        const user = await getUserById(userId);

        if (!user) {
          return res.status(403).json({
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "User associated with token no longer exists"
            }
          });
        }

        // Rotate tokens
        const tokens = generateTokens({
          id: user.id,
          email: user.email,
          role: user.role
        });

        // Revoke old refresh token (Token rotation safety) in Firestore
        await revokeToken(refreshToken);

        res.cookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
          success: true,
          data: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: `req_${Math.random().toString(36).substring(2, 15)}`
          }
        });
      } catch (innerErr) {
        console.error("Token verification db lookup error:", innerErr);
        res.status(500).json({
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An error occurred during token refresh verification"
          }
        });
      }
    });

  } catch (error) {
    console.error("Auth refresh error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Token refresh failed"
      }
    });
  }
});

// 4. LOGOUT
authRouter.post("/logout", async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (refreshToken) {
      await revokeToken(refreshToken);
    }
    res.clearCookie("refreshToken");
    res.json({
      success: true,
      data: { message: "Logged out successfully" }
    });
  } catch (error) {
    console.error("Auth logout error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred during logout"
      }
    });
  }
});
