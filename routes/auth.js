var express = require('express');
const zxcvbn = require('zxcvbn');
const User = require('./../models/User');
const Pet = require('./../models/Pet');
var router = express.Router();
const parser = require('./../config/cloudinary');

// 0 - Require bcrypt
const bcrypt = require('bcrypt');
// 1 - Specify how many salt rounds
const saltRounds = 10;

// POST '/auth/signup'
router.post('/signup', parser.single('picture'), (req, res, next) => {

  // 2 - Destructure the password and username
  const { email , password, name , description } = req.body;

  // 3 - Check if the username and password are empty strings
  if (email === '' || password === '') {
    res.render('prelogin-views/signup', {
      errorMessage: 'Provide email and password.',
    });
    return;
  }
  // 4 - Check if the username already exists - if so send error

  User.findOne({ email })
    .then(user => {
      // > If username exists already send the error
      if (user) {
        res.render('prelogin-views/signup', {
          errorMessage: 'Username already exists.',
        });
        return;
      }

      // > If username doesn't exist, generate salts and hash the password
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const image_url = req.file.secure_url
      // > Create the user in the DB
      User.create({ email, password: hashedPassword, pictureUrl: image_url , name, description , pets: null, requests: null})
        .then(newUserObj => {
          req.session.currentUser = newUserObj;
          res.redirect('/home');
        })
        .catch(err => {
          res.render('prelogin-views/signup', {
            errorMessage: 'Error while creating new username.',
          });
        });

      // > Once the user is cretaed , redirect to home
    })
    .catch(err => console.log(err));
});

// POST 'auth/login'
router.post('/login', (req, res, next) => {
  // Deconstruct the password and the user
  const { email , password: enteredPassword } = req.body;

  // Check if username or password are empty strings
  if (email === '' || enteredPassword === '') {
    res.render('prelogin-views/login', {
      errorMessage: 'Provide username and password',
    });
    return;
  }

  // Find the user by username
  User.findOne({ email })
    .then(userData => {
      // If - username doesn't exist - return error
      //console.log(req.session);
      //console.log(userData)
      
      if (!userData) {
        res.render('prelogin-views/login', { errorMessage: 'Username not found!' });
        return;
      }

      // If username exists - check if the password is correct
      const hashedPasswordFromDB = userData.password; // Hashed password saved in DB during signup

      const passwordCorrect = bcrypt.compareSync(
        enteredPassword,
        hashedPasswordFromDB,
      );

      // If password is correct - create session (& cookie) and redirect

      if (passwordCorrect) {
        // Save the login in the session ( and create cookie )
        // And redirect the user
        req.session.currentUser = userData;
        res.redirect('/home');
      }

      // Else - if password incorrect - return error
    })
    .catch(err => console.log(err)); 
});

//ADD A PET FORM

router.post('/add-pet', parser.single('picture'), (req, res, next) => {


  // 2 - Destructure the password and username
  const { name , age, breed , description  } = req.body;

      const image_url = req.file.secure_url // to get the image with cloudinary
      // > Create the user in the DB
      Pet.create({ name, age, petPictureUrl: image_url, description, petType: null, requests: null, breed})
        .then(newPetObj => {
          console.log('it didnt fuck up');
          req.session.currentUser.pets.push(newPetObj._id) = newPetObj;
          res.redirect('/profile');
        })
        .catch(err => {
          console.log(err);
            errorMessage: 'Error while creating new pet.'
        })
      // > Once the user is cretaed , redirect to profile
    .catch(err => console.log(err));
});

module.exports = router;
