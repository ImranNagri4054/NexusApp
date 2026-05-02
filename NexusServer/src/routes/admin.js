const express = require('express');
const Journal = require('../models/Journal');
const Issue = require('../models/Issue');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/admin');

const router = express.Router();

router.use(authRequired, adminRequired);

// ----- Journals -----
router.get('/journals', async (_req, res) => {
  try {
    const journals = await Journal.find({})
      .sort({ createdAt: -1 })
      .populate('author', 'email firstName lastName')
      .populate('issue', 'volume issueNumber month year status');
    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch journals' });
  }
});

router.patch('/journals/:id/review', async (req, res) => {
  try {
    const { decision, rejectionFeedback } = req.body;
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be "approve" or "reject"' });
    }
    const journal = await Journal.findById(req.params.id);
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    if (decision === 'reject') {
      const fb = typeof rejectionFeedback === 'string' ? rejectionFeedback.trim() : '';
      if (!fb) {
        return res.status(400).json({
          message: 'Rejection feedback is required (explain what the author must fix)',
        });
      }
      await Journal.updateOne({ _id: journal._id }, { $set: { status: 'rejected', rejectionFeedback: fb } });
    } else {
      await Journal.updateOne({ _id: journal._id }, { $set: { status: 'accepted' }, $unset: { rejectionFeedback: '' } });
    }

    const updated = await Journal.findById(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update journal' });
  }
});

// ----- Issues (create / edit / delete / review — admin only) -----
router.get('/issues', async (_req, res) => {
  try {
    const issues = await Issue.find({}).sort({
      year: -1,
      volume: -1,
      issueNumber: -1,
      createdAt: -1,
    });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch issues' });
  }
});

router.post('/issues', async (req, res) => {
  try {
    const { volume, issueNumber, month, year, description, pdfUrl, journalTitle } = req.body;

    if (!volume || !issueNumber || !month || !year) {
      return res.status(400).json({ message: 'volume, issueNumber, month, and year are required' });
    }

    const issue = await Issue.create({
      createdBy: req.user._id,
      volume,
      issueNumber,
      month,
      year,
      description,
      pdfUrl,
      journalTitle,
      status: 'under_review',
    });

    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create issue' });
  }
});

router.put('/issues/:id', async (req, res) => {
  try {
    const { volume, issueNumber, month, year, description, pdfUrl, journalTitle } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.volume = volume ?? issue.volume;
    issue.issueNumber = issueNumber ?? issue.issueNumber;
    issue.month = month ?? issue.month;
    issue.year = year ?? issue.year;
    issue.description = description ?? issue.description;
    issue.pdfUrl = pdfUrl ?? issue.pdfUrl;
    issue.journalTitle = journalTitle ?? issue.journalTitle;

    const saved = await issue.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update issue' });
  }
});

router.delete('/issues/:id', async (req, res) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.json({ message: 'Issue deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete issue' });
  }
});

router.patch('/issues/:id/review', async (req, res) => {
  try {
    const { decision } = req.body;
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be "approve" or "reject"' });
    }
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    issue.status = decision === 'approve' ? 'accepted' : 'rejected';
    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update issue' });
  }
});

module.exports = router;
