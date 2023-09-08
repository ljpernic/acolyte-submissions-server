const GridFsStorage = require('multer-gridfs-storage');
const crypto = require('crypto');

// CREATE STORAGE ENGINE //
const engine = async (req, res, next) => {
    const storage = new GridFsStorage({
      url: process.env.MONGO_URI,
        file: (req, res, file) => {
            console.log(req.body)
        return new Promise((resolve, reject) => {
          crypto.randomBytes(16, (err, buf) => {
              if (err) {
                  return reject(err);
              }
              const filename = buf.toString('hex') + path.extname(file.originalname);
              const fileInfo = {
                  filename: filename,
                  bucketName: 'uploads'
              };
              resolve(fileInfo);
          });
      });
  }})}

module.exports = engine