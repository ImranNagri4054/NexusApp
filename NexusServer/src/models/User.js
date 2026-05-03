const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, unique: true, sparse: true, index: true },
    institution: { type: String },
    orcid: { type: String },
    researchInterests: { type: String },

    // Local auth
    passwordHash: { type: String },

    // OAuth
    googleId: { type: String, index: true },
    githubId: { type: String, index: true },

    /** Application role for routing and admin access; distinct from legacy `roles` below. */
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    roles: [{ type: String, default: 'author' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

