const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const Usermodel = require('./Models/UserModel');
const Postmodel = require('./Models/PostModel')

require('dotenv').config()
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('Public'))


app.use(cors({
    origin: 'http://localhost:5173', // Allow requests from this origin
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    credentials: true // Allow cookies to be sent cross-origin
}));

app.use(cookieParser());

const database = process.env.URI

// MongoDB Connection
mongoose.connect(database)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });

// Routes
app.post('/register', async (req, res) => {
    try {
        const {username, email, password} = req.body
        
        const user = await Usermodel.create(req.body);
        res.json("success");
        console.log(user)
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        console.log(error)
    }
});

const jwt = require('jsonwebtoken'); // Importing JWT library
const multer = require('multer');
const path = require('path');

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Usermodel.findOne({ email: email });

        if (user) {
            if (user.password === password) {
                // Sign the JWT token
                const token = jwt.sign(
                    { email: user.email, username: user.username },
                    "jwt-secret-key",
                    { expiresIn: '1d' }
                );
                console.log('token : ',token)
                

                // Set the token as a cookie
                const cookieName = "token";
                res.cookie(cookieName, token, { maxAge: 86400000, httpOnly: true });
                


                res.json("success");
                // res.json( token)
            } else {
                res.json("Password is incorrect");
            }
        } else {
            res.json('User does not exist');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json('Internal Server Error');
    }
});

const verifyUser=(req,res,next) => {
    const token = req.cookies.token;
    if(!token){
        return res.json('Please Login')
    }
    else{
        jwt.verify(token, "jwt-secret-key", (err,decoded)=>{
            if(err){
                return res.json("Token is invalid")
            }
            else{
                req.email = decoded.email;
                req.username = decoded.username;
                next()
            }
        })
    }
}

app.get('/', verifyUser,(req,res)=>{
    return res.json({email : req.email, username: req.username})
})

const storage = multer.diskStorage({
    destination : (req,file,cb)=>{
        cb(null, 'Public/Images')
    },
    filename : (req, file, cb) =>{
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage : storage
})
app.post('/create', verifyUser, upload.single('image'), (req, res) => {
    Postmodel.create({
      title: req.body.title,
      author: req.body.author,
      content: req.body.content,
      file: req.file.filename ,
      email: req.body.email
    })
      .then(result => {
        console.log('Post created successfully:', result);
        return res.json("success");
      })
      .catch(err => {
        console.error('Error creating post:', err);
        res.status(500).json({ error: err.message });
      });
  });

  app.get('/getpostbyid/:id', (req, res) => {
    const id = req.params.id;
    Postmodel.findById(id)
      .then(post => res.json(post))
      .catch(err => console.log(err));
  });
  
  
  
app.get('/logout',(req,res)=>{
    res.clearCookie('token')
    return res.json('success')
})

app.get('/getposts', (req, res) => {
    Postmodel.find()
        .then(posts => res.json(posts))
        .catch(err => res.json(err)); // Corrected from .err(err => res.json(err))
});

app.put('/editpost/:id',(req,res)=>{
    const id = req.params.id
    Postmodel.findByIdAndUpdate({_id:id}, { title:req.body.title,  content:req.body.content})

    .then(result=>res.json("success"))
    .catch(err=>res.json(err))
})


app.delete('/deletepost/:id', (req, res) => {
    Postmodel.findByIdAndDelete(req.params.id)
        .then(() => res.json("success"))
        .catch(err => res.json(err));
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
