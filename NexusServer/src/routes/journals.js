const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Journal = require('../models/Journal');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// File upload config for journal images
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Create Journal (Create Submission)
router.post('/', authRequired, upload.single('image'), async (req, res) => {
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

    let parsedExtra = {};
    if (extraSections) {
      try {
        parsedExtra = JSON.parse(extraSections);
      } catch (e) {
        parsedExtra = {};
      }
    }

    const imagePath = req.file
      ? `/uploads/journals/${req.file.filename}`
      : undefined;

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
      issue: issue || undefined,
      authors: authorsArr,
      extraSections: parsedExtra,
    });

    res.status(201).json(journal);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create journal' });
  }
});

// Public: list all journals (for Featured Research)
router.get('/', async (req, res) => {
  try {
    const journals = await Journal.find({})
      .sort({ createdAt: -1 })
      .select('title abstract createdAt imagePath keywords authors');
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

// Public: get single journal by id
router.get('/:id', async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    res.json(journal);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch journal' });
  }
});

// Update journal
router.put('/:id', authRequired, upload.single('image'), async (req, res) => {
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

    if (req.file) {
      journal.imagePath = `/uploads/journals/${req.file.filename}`;
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

    const saved = await journal.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update journal' });
  }
});

module.exports = router;

