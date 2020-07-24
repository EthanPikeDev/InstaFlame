const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const requireLogin = require("../middleware/requireLogin");
const Post = mongoose.model("Post");

//get request to get all the posts
router.get("/allpost", requireLogin, (req, res) => {
  Post.find()
    .populate("postedBy", "_id name") //specify the fields that you want to fetch, here I leave out the email and password
    .then((posts) => {
      //And only fetch the name and id with the get request
      res.json({ posts });
    })
    .catch((err) => {
      console.log(err);
    });
});

//Route to display only the posts by the users that you follow
router.get("/getsubpost", requireLogin, (req, res) => {
  //if postedby in following
  Post.find({ postedBy: { $in: req.user.following } })
    .populate("postedBy", "_id name") //specify the fields that you want to fetch, here I leave out the email and password
    .then((posts) => {
      //And only fetch the name and id with the get request
      res.json({ posts });
    })
    .catch((err) => {
      console.log(err);
    });
});

//post request to create posts
router.post("/createpost", requireLogin, (req, res) => {
  const { title, body, pic } = req.body;

  if (!title || !body || !pic) {
    return res.status(422).json({ error: "Please add all the fields" });
  }
  //made this password undefined so that the password does not get stored along with
  //the post for added security
  req.user.password = undefined;
  const post = new Post({
    title,
    body,
    photo: pic,
    postedBy: req.user,
  });
  post
    .save()
    .then((result) => {
      res.json({ post: result });
    })
    .catch((err) => {
      console.log(err);
    });
});

//list all posts created by specific user (on their profile)
router.get("/mypost", requireLogin, (req, res) => {
  Post.find({ postedBy: req.user._id })
    .populate("PostedBy", "_id name")
    .then((mypost) => {
      res.json({ mypost });
    })
    .catch((err) => {
      console.log(err);
    });
});

//update route for liking posts
router.put("/like", requireLogin, (req, res) => {
  this.post;
  Post.findByIdAndUpdate(
    req.body.postId,
    {
      $push: { likes: req.user._id },
    },
    {
      new: true,
    }
  ).exec((err, result) => {
    if (err) {
      return res.status(422).json({ error: err });
    } else {
      res.json(result);
    }
  });
});

//update route for unliking a post
router.put("/unlike", requireLogin, (req, res) => {
  this.post;
  Post.findByIdAndUpdate(
    req.body.postId,
    {
      $pull: { likes: req.user._id },
    },
    {
      new: true,
    }
  ).exec((err, result) => {
    if (err) {
      return res.status(422).json({ error: err });
    } else {
      res.json(result);
    }
  });
});

//route for comments from the user
router.put("/comment", requireLogin, (req, res) => {
  const comment = {
    text: req.body.text,
    postedBy: req.user._id,
  };

  Post.findByIdAndUpdate(
    req.body.postId,
    {
      $push: { comments: comment },
    },
    {
      new: true,
    }
  )
    .populate("postedBy", "_id name")
    .populate("comments.postedBy", "_id name")

    .exec((err, result) => {
      if (err) {
        return res.status(422).json({ error: err });
      } else {
        res.json(result);
      }
    });
});

//Route to delete posts made by the user themselves
router.delete("/deletepost/:postId", requireLogin, (req, res) => {
  Post.findOne({ _id: req.params.postId })
    .populate("postedBy", "_id")
    .exec((err, post) => {
      if (err || !post) {
        return res.status(422).json({ error: err });
      }
      if (post.postedBy._id.toString() === req.user._id.toString()) {
        post
          .remove()
          .then((result) => {
            res.json(result);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
});

module.exports = router;
