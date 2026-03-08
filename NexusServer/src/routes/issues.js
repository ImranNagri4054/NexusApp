const express = require('express');
const Issue = require('../models/Issue');
const Journal = require('../models/Journal');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Create issue
router.post('/', authRequired, async (req, res) => {
  try {
    const { volume, issueNumber, month, year, description, pdfUrl, journalTitle } = req.body;

    if (!volume || !issueNumber || !month || !year) {
      return res.status(400).json({ message: 'volume, issueNumber, month, and year are required' });
    }

    const issue = await Issue.create({
      volume,
      issueNumber,
      month,
      year,
      description,
      pdfUrl,
      journalTitle,
    });

    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create issue' });
  }
});

// List all issues (latest first)
router.get('/', async (req, res) => {
  try {
    const issues = await Issue.find({}).sort({ year: -1, volume: -1, issueNumber: -1, createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch issues' });
  }
});

// Get current/latest issue
router.get('/current', async (req, res) => {
  try {
    const issue = await Issue.findOne({})
      .sort({ year: -1, volume: -1, issueNumber: -1, createdAt: -1 });
    if (!issue) {
      return res.status(404).json({ message: 'No issues found' });
    }
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch current issue' });
  }
});

// Get single issue
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch issue' });
  }
});

// Update issue
router.put('/:id', authRequired, async (req, res) => {
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

// Delete issue (does not delete journals; they retain issue reference)
router.delete('/:id', authRequired, async (req, res) => {
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

// Get journals (articles) for a given issue
router.get('/:id/journals', async (req, res) => {
  try {
    const journals = await Journal.find({ issue: req.params.id })
      .sort({ createdAt: -1 })
      .select('title abstract createdAt imagePath keywords authors');
    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch journals for issue' });
  }
});

module.exports = router;

