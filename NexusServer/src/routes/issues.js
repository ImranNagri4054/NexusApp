const express = require('express');
const Issue = require('../models/Issue');
const Journal = require('../models/Journal');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

/** Public issue listing: approved only; legacy docs without `status` still show. */
function publicIssueMongoFilter() {
  return {
    $nor: [{ status: 'under_review' }, { status: 'rejected' }],
  };
}

function issueIsPublicVisible(doc) {
  if (doc.status == null || doc.status === undefined) return true;
  return doc.status !== 'under_review' && doc.status !== 'rejected';
}

// List approved issues only (submit-form dropdown, current issues, archives flow)
router.get('/', async (_req, res) => {
  try {
    const issues = await Issue.find(publicIssueMongoFilter()).sort({
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

// Authenticated: list only the current user's own issues for journal assignment
router.get('/mine', authRequired, async (req, res) => {
  try {
    const issues = await Issue.find({
      createdBy: req.user._id,
      $nor: [{ status: 'rejected' }],
    }).sort({
      year: -1,
      volume: -1,
      issueNumber: -1,
      createdAt: -1,
    });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your issues' });
  }
});

// Create issue (volume) for current user; starts in review
router.post('/', authRequired, async (req, res) => {
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

router.get('/current', async (_req, res) => {
  try {
    const issue = await Issue.findOne(publicIssueMongoFilter()).sort({
      year: -1,
      volume: -1,
      issueNumber: -1,
      createdAt: -1,
    });
    if (!issue) {
      return res.status(404).json({ message: 'No issues found' });
    }
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch current issue' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    if (!issueIsPublicVisible(issue)) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch issue' });
  }
});

// Update own issue (or admin can update any)
router.put('/:id', authRequired, async (req, res) => {
  try {
    const { volume, issueNumber, month, year, description, pdfUrl, journalTitle } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const isOwner = issue.createdBy && String(issue.createdBy) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You are not allowed to edit this issue' });
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

// Delete own issue (or admin can delete any)
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const isOwner = issue.createdBy && String(issue.createdBy) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You are not allowed to delete this issue' });
    }

    await Issue.findByIdAndDelete(req.params.id);
    res.json({ message: 'Issue deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete issue' });
  }
});

// Journals assigned to this issue (published articles only)
router.get('/:id/journals', async (req, res) => {
  try {
    const journals = await Journal.find({
      issue: req.params.id,
      ...publicJournalMongoFilterFromIssues(),
    })
      .sort({ createdAt: -1 })
      .select('title abstract createdAt imagePath pdfPath keywords authors');
    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch journals for issue' });
  }
});

/** Same visibility rule as journals route — keep in sync. */
function publicJournalMongoFilterFromIssues() {
  return {
    $nor: [
      { status: 'under_review' },
      { status: 'resubmitted' },
      { status: 'rejected' },
      { status: 'draft' },
    ],
  };
}

module.exports = router;
