const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "change-this-jwt-secret";
const CLIENT_URL = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const HAS_GOOGLE = !!(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);
const HAS_GITHUB = !!(
  process.env.GITHUB_CLIENT_ID ||
  ("" && process.env.GITHUB_CLIENT_SECRET) ||
  ""
);

// ----- Passport setup for OAuth -----
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

if (HAS_GOOGLE) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          // Try to find by googleId OR existing account with same email
          let user =
            (await User.findOne({ googleId: profile.id })) ||
            (email ? await User.findOne({ email }) : null);

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              email,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
            });
          } else {
            // Link Google to existing user if not already linked
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
}

if (HAS_GITHUB) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/api/auth/github/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          // Try to find by githubId OR existing account with same email
          let user =
            (await User.findOne({ githubId: profile.id })) ||
            (email ? await User.findOne({ email }) : null);

          if (!user) {
            user = await User.create({
              githubId: profile.id,
              email,
              firstName: profile.displayName,
            });
          } else {
            // Link GitHub to existing user if not already linked
            if (!user.githubId) {
              user.githubId = profile.id;
              await user.save();
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
}

router.use(passport.initialize());
router.use(passport.session());

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

// ----- Local Register -----
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      institution,
      orcid,
      researchInterests,
      password,
    } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: "User already exists with this email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      institution,
      orcid,
      researchInterests,
      passwordHash,
    });

    const token = generateToken(user);
    res
      .cookie("token", token, { httpOnly: true, sameSite: "lax" })
      .status(201)
      .json({
        user: { id: user._id, email: user.email, firstName: user.firstName },
      });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
});

// ----- Local Login -----
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" }).json({
      user: { id: user._id, email: user.email, firstName: user.firstName },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

// ----- OAuth: Google -----
if (HAS_GOOGLE) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${CLIENT_URL}/login.html`,
    }),
    (req, res) => {
      const token = generateToken(req.user);
      res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
      res.redirect(`${CLIENT_URL}/`);
    },
  );
} else {
  router.get("/google", (_req, res) => {
    res
      .status(503)
      .json({ message: "Google login is not configured on the server." });
  });
}

// ----- OAuth: GitHub -----
if (HAS_GITHUB) {
  router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"] }),
  );

  router.get(
    "/github/callback",
    passport.authenticate("github", {
      failureRedirect: `${CLIENT_URL}/login.html`,
    }),
    (req, res) => {
      const token = generateToken(req.user);
      res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
      res.redirect(`${CLIENT_URL}/`);
    },
  );
} else {
  router.get("/github", (_req, res) => {
    res
      .status(503)
      .json({ message: "GitHub login is not configured on the server." });
  });
}

// ----- Logout -----
router.post("/logout", (req, res) => {
  req.logout?.(() => {});
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// ----- Current user (from JWT cookie) -----
router.get("/me", async (req, res) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
