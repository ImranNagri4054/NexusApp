const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    journalTitle: {
      type: String,
      default: 'The Nexus Journal of Research and Innovation',
    },
    volume: { type: Number, required: true },
    issueNumber: { type: Number, required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    description: { type: String },
    pdfUrl: { type: String }, // optional: complete issue PDF
    status: {
      type: String,
      enum: ['under_review', 'accepted', 'rejected'],
      default: 'under_review',
    },
  },
  { timestamps: true }
);

issueSchema.index({ volume: -1, issueNumber: -1, year: -1 });

module.exports = mongoose.model('Issue', issueSchema);

