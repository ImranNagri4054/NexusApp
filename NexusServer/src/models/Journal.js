const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
    },
    authors: [{ type: String }],
    title: { type: String, required: true },
    abstract: { type: String, required: true },
    introduction: { type: String, required: true },
    methods: { type: String, required: true },
    results: { type: String, required: true },
    discussion: { type: String, required: true },
    references: { type: String, required: true },
    keywords: { type: String },
    imagePath: { type: String },
    pdfPath: { type: String },
    /** Shown to the author when status is rejected; remains visible until approve (or overwritten on next reject). */
    rejectionFeedback: { type: String },
    // Extra flexible field for additional sections
    extraSections: {
      type: Map,
      of: String,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'resubmitted', 'accepted', 'rejected'],
      default: 'under_review',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Journal', journalSchema);

