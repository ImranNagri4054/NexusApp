const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Journal = require('../models/Journal');
const Issue = require('../models/Issue');
const { authRequired } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');

/** Listed on the public site (homepage, etc.); excludes pending / rejected / draft. */
function publicJournalMongoFilter() {
  return {
    $nor: [
      { status: 'under_review' },
      { status: 'resubmitted' },
      { status: 'rejected' },
      { status: 'draft' },
    ],
  };
}

function journalIsPublicPublished(doc) {
  if (!doc.status) return true;
  const s = doc.status;
  return s !== 'under_review' && s !== 'resubmitted' && s !== 'rejected' && s !== 'draft';
}

const router = express.Router();

// File upload config for journal assets (image + pdf)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'journals');
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {
      // ignore if exists or cannot create; multer will surface error
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// Create Journal (Create Submission)
router.post(
  '/',
  authRequired,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  async (req, res) => {
  try {
    const {
      title,
      abstract,
      introduction,
      methods,
      results,
      discussion,
      references,
      keywords,
      extraSections,
      issue,
      authors,
    } = req.body;

    if (!title || !abstract || !introduction || !methods || !results || !discussion || !references) {
      return res.status(400).json({ message: 'All core sections are required' });
    }

    if (issue) {
      const selectedIssue = await Issue.findById(issue);
      if (!selectedIssue) {
        return res.status(400).json({ message: 'Selected issue does not exist' });
      }
      if (req.user.role !== 'admin') {
        if (!selectedIssue.createdBy) {
          return res.status(403).json({ message: 'You can only use your own issue/volume' });
        }
        if (String(selectedIssue.createdBy) !== String(req.user._id)) {
          return res.status(403).json({ message: 'You can only use your own issue/volume' });
        }
      }
    }

    let parsedExtra = {};
    if (extraSections) {
      try {
        parsedExtra = JSON.parse(extraSections);
      } catch (e) {
        parsedExtra = {};
      }
    }

    const imageFile = req.files && req.files.image ? req.files.image[0] : null;
    const pdfFile = req.files && req.files.pdf ? req.files.pdf[0] : null;

    const imagePath = imageFile ? `/uploads/journals/${imageFile.filename}` : undefined;
    const pdfPath = pdfFile ? `/uploads/journals/${pdfFile.filename}` : undefined;

    let authorsArr = [];
    if (authors) {
      try {
        authorsArr = JSON.parse(authors);
      } catch (e) {
        authorsArr = [];
      }
    }

    const journal = await Journal.create({
      author: req.user._id,
      title,
      abstract,
      introduction,
      methods,
      results,
      discussion,
      references,
      keywords,
      imagePath,
      pdfPath,
      issue: issue || undefined,
      authors: authorsArr,
      extraSections: parsedExtra,
      status: 'under_review',
    });

    res.status(201).json(journal);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create journal' });
  }
}
);

// Public: list published journals (for Featured Research)
router.get('/', async (req, res) => {
  try {
    const journals = await Journal.find(publicJournalMongoFilter())
      .sort({ createdAt: -1 })
      .select('title abstract createdAt imagePath pdfPath keywords authors');
    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch journals' });
  }
});

// List current user's submissions
router.get('/mine', authRequired, async (req, res) => {
  try {
    const journals = await Journal.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch journals' });
  }
});

// Single journal: published for everyone; drafts / pending only for author or admin
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    if (journalIsPublicPublished(journal)) {
      return res.json(journal);
    }

    if (!req.user) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    const isAuthor = String(journal.author) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    res.json(journal);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch journal' });
  }
});

// Update journal
router.put(
  '/:id',
  authRequired,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }

    if (String(journal.author) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You are not allowed to edit this journal' });
    }

    const {
      title,
      abstract,
      introduction,
      methods,
      results,
      discussion,
      references,
      keywords,
      extraSections,
      issue,
      authors,
    } = req.body;

    if (!title || !abstract || !introduction || !methods || !results || !discussion || !references) {
      return res.status(400).json({ message: 'All core sections are required' });
    }

    if (issue) {
      const selectedIssue = await Issue.findById(issue);
      if (!selectedIssue) {
        return res.status(400).json({ message: 'Selected issue does not exist' });
      }
      if (req.user.role !== 'admin') {
        if (!selectedIssue.createdBy) {
          return res.status(403).json({ message: 'You can only use your own issue/volume' });
        }
        if (String(selectedIssue.createdBy) !== String(req.user._id)) {
          return res.status(403).json({ message: 'You can only use your own issue/volume' });
        }
      }
    }

    let parsedExtra = {};
    if (extraSections) {
      try {
        parsedExtra = JSON.parse(extraSections);
      } catch (e) {
        parsedExtra = {};
      }
    }

    let authorsArr = journal.authors || [];
    if (authors) {
      try {
        authorsArr = JSON.parse(authors);
      } catch (e) {
        authorsArr = journal.authors || [];
      }
    }

    const imageFile = req.files && req.files.image ? req.files.image[0] : null;
    const pdfFile = req.files && req.files.pdf ? req.files.pdf[0] : null;
    if (imageFile) {
      journal.imagePath = `/uploads/journals/${imageFile.filename}`;
    }
    if (pdfFile) {
      journal.pdfPath = `/uploads/journals/${pdfFile.filename}`;
    }

    journal.title = title;
    journal.abstract = abstract;
    journal.introduction = introduction;
    journal.methods = methods;
    journal.results = results;
    journal.discussion = discussion;
    journal.references = references;
    journal.keywords = keywords || journal.keywords;
    journal.issue = issue || journal.issue;
    journal.authors = authorsArr;
    if (Object.keys(parsedExtra).length > 0) {
      journal.extraSections = parsedExtra;
    }

    // After addressing admin feedback the author revision is tracked as resubmitted
    if (journal.status === 'rejected' || journal.status === 'resubmitted') {
      journal.status = 'resubmitted';
    }

    const saved = await journal.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update journal' });
  }
}
);

module.exports = router;

