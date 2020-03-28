const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      escape(title);
      escape(author);
      escape(email);
      escape(fileExt);
      if((fileExt === 'jpg' || fileExt === 'png' || fileExt === 'gif') && title.length < 25 && author.length < 50) {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      }
      else {
        throw new Error('Wrong input!');
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

function escape(html) {
  return html.replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/\$/g, "&#036")
             .replace(/-/g, "&#045")
             .replace(/\//g, "&#047")
             .replace(/\\/g, "&#092")
             .replace(/\|/g, "&#124")
             .replace(/'/g, "&#039;");
}

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      const checkUser = await Voter.findOne({ user: req.clientIp });
      if(checkUser) {
        if(checkUser.votes.includes(photoToUpdate._id))  res.status(500).json({ message: 'This user has been already voted!' });
        else {
          checkUser.votes.push(photoToUpdate._id);
          checkUser.save();
          photoToUpdate.votes++;
          photoToUpdate.save();
          res.send({ message: 'OK' });
        }
      }
      else {
        const newVoter = new Voter({ user: req.clientIp, votes: [photoToUpdate._id] });
        await newVoter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      }
    }
  } catch(err) {
    res.status(500).json(err);
  }

};
