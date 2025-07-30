// server.js
/*const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.static('uploads'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error(err));

// Pixel Schema
const pixelSchema = new mongoose.Schema({
  name: String,
  ownerEmail: String,
  link: String,
  tooltip: String,
  image: String,
  x: Number,
  y: Number
});
const Pixel = mongoose.model('Pixel', pixelSchema);

// Image upload
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, unique);
  }
});
const upload = multer({ storage });

// POST /api/pixels
app.post('/api/pixels', upload.single('image'), async (req, res) => {
  try {
    const { name, email, link, tooltip, x, y } = req.body;
    const imagePath = req.file.filename;

    const pixel = new Pixel({
      name,
      ownerEmail: email,
      link,
      tooltip,
      image: imagePath,
      x: parseInt(x),
      y: parseInt(y)
    });

    await pixel.save();
    res.json({ msg: 'Pixel uploaded successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});
*/


// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
//added for image
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');


dotenv.config();

//added for image
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const app = express();
app.use(cors());
app.use(express.json()); // needed for API parsing
//app.use(express.static('uploads'));

// ✅ Serve static files from uploads folder under /uploads
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error(err));

// Pixel Schema
const pixelSchema = new mongoose.Schema({
  name: String,
  ownerEmail: String,
  link: String,
  tooltip: String,
  image: String,
  x: Number,
  y: Number,
  approved: { type: Boolean, default: false }
});
const Pixel = mongoose.model('Pixel', pixelSchema);

// Multer config
// const storage = multer.diskStorage({
//   destination: 'uploads/',
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
//     cb(null, unique);
//   }
// });
// const upload = multer({ storage });

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pixel-uploads',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 300, height: 300, crop: 'limit' }],
  },
});
const upload = multer({ storage });


// ✅ POST /api/pixels → Upload pixel
app.post('/api/pixels', upload.single('image'), async (req, res) => {
  try {
    const { name, email, link, tooltip, x, y } = req.body;
    const imagePath = req.file.path; // This gives the full Cloudinary URL


     const xCoord = parseInt(x);
    const yCoord = parseInt(y);

    // 🔍 Check if a pixel already exists at (x, y)
    const existingPixel = await Pixel.findOne({ x: xCoord, y: yCoord });

    if (existingPixel) {
      // Delete the uploaded file since we're rejecting it
      const fs = require('fs');
      fs.unlinkSync(`uploads/${imagePath}`);
      return res.status(409).json({ msg: 'Pixel already occupied at this location.' });
    }

    const pixel = new Pixel({
      name,
      ownerEmail: email,
      link,
      tooltip,
      image: imagePath,
      x: parseInt(x),
      y: parseInt(y)
    });

    await pixel.save();
    res.json({ msg: 'Pixel uploaded successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ✅ NEW: GET /api/pixels → Fetch all pixel data
app.get('/api/pixels', async (req, res) => {
  try {
    //const pixels = await Pixel.find({});

    const pixels = await Pixel.find({ approved: true });

    res.json(pixels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch pixels' });
  }
});

/*app.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});*/

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});


//for admin
// Authenticate admin using username & password.
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    res.json({ msg: 'Login successful' });
  } else {
    res.status(401).json({ msg: 'Unauthorized' });
  }
});

//Fetch all uploaded pixel submissions.
app.get('/api/admin/pixels', async (req, res) => {
  try {
    const pixels = await Pixel.find({});
    res.json(pixels);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch pixels' });
  }
});


//Remove a pixel ad from database (also optionally delete its image file).
const fs = require('fs');

/*app.delete('/api/admin/pixels/:id', async (req, res) => {
  try {
    const pixel = await Pixel.findByIdAndDelete(req.params.id);
    if (pixel && pixel.image) {
      const imagePath = path.join(__dirname, 'uploads', pixel.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    res.json({ msg: 'Pixel deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to delete pixel' });
  }
});*/

app.delete('/api/admin/pixels/:id', async (req, res) => {
  try {
    const pixel = await Pixel.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Pixel deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to delete pixel' });
  }
});

//route to approve:

app.patch('/api/admin/pixels/:id/approve', async (req, res) => {
  try {
    await Pixel.findByIdAndUpdate(req.params.id, { approved: true });
    res.json({ msg: 'Pixel approved' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to approve pixel' });
  }
});
