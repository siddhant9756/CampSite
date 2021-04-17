//finding campground
var express = require("express");
var router  = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");


//Comments New
router.get("/campgrounds/:id/comments/new", isLoggedIn, function(req, res){
    // find campground by id
    console.log(req.params.id);
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {campground: campground});
        }
    })
});

//Comments Create
router.post("/campgrounds/:id/comments/",isLoggedIn,function(req, res){
   //lookup campground using ID
   Campground.findById(req.params.id, function(err, campground){
       if(err){
           console.log(err);
           res.redirect("/campgrounds");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               comment.save();
               campground.comments.push(comment);
               campground.save();
               console.log(comment);
               req.flash('success', 'Created a comment!');
               res.redirect('/campgrounds/' + campground._id);
           }
        });
       }
   });
});

router.get("/campgrounds/:id/comments/:commentId/edit", isLoggedIn, function(req, res){
    // find campground by id
    Comment.findById(req.params.commentId, function(err, comment){
        if(err){
            console.log(err);
        } else {
             res.render("comments/edit", {campground_id: req.params.id, comment: comment});
        }
    })
});

router.put("/campgrounds/:id/comments/:commentId", function(req, res){
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, comment){
       if(err){
           res.render("edit");
       } else {
           res.redirect("/campgrounds/" + req.params.id);
       }
   }); 
});

router.delete("/campgrounds/:id/comments/:commentId",commentrights, function(req, res){
    Comment.findByIdAndRemove(req.params.commentId, function(err){
        if(err){
            console.log("PROBLEM!");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
});


//middleware
function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  req.flash("error", "You need to be logged in to do that");
  res.redirect("/login");
}



function commentrights(req,res,next){
  if(req.isAuthenticated()){
    Comment.findById(req.params.comment_id,function(err,comment){
      if(comment.author.id.equals(req.user._id)){
        next();
      }
      else
      {
        req.flash("error", "You don't have permission to do that");
                res.redirect("back");
            }
    });
  }
  else
  {
    req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}

module.exports = router;