const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();
require("dotenv").config();
// const PORT = 3001

const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// mongo Conn (add your own url -_-)
mongoose.connect(
  process.env.MONGODB_URL,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// img schema
const imageSchema = new mongoose.Schema({
  url: String,
});
const Image = mongoose.model('Image', imageSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage });

//  cloudinary config (use your own cloudinary keys and stuff)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
app.get('/', (req, res) => {
  res.render('index', { title: 'CloudPic' });
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      ).end(req.file.buffer);
    });
    

    // Saving img URL in MongoDB
    const image = new Image({ url: result.secure_url });
    await image.save();

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
