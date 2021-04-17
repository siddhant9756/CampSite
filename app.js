var express          = require("express"),
    app              = express(),
    bodyParser       = require("body-parser"),
    mongoose         = require("mongoose"),
    passport         = require("passport"),
    cookieParser     = require("cookie-parser"),
    LocalStrategy    = require("passport-local"),
    flash            = require("connect-flash"),
    Campground       = require("./models/campground"),
    Comment          = require("./models/comment"),
    User             = require("./models/user"),
    session          = require("express-session"),
    seedDB           = require("./seeds"),
    methodOverride   = require("method-override"),
    request          = require("request"),
    path             = require("path");
    
//requiring routes
// var commentRoutes    = require("./routes/comments"),
//     campgroundRoutes = require("./routes/campgrounds"),
//     indexRoutes      = require("./routes/index");



// app.use(commentRoutes);
// app.use(campgroundsRoutes);
// app.use(indexRoutes);
mongoose.connect("mongodb://localhost/yelp_camp");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname , "/public")));
app.use(methodOverride('_method'));
app.use(cookieParser('secret'));

// seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});
// app.use("/", indexRoutes);
// app.use("/campgrounds", campgroundRoutes);
// app.use("/campgrounds/:id/comments", commentRoutes);

app.get("/",function(req,res){
    res.render("landing");
});

//INDEX - show all campgrounds
app.get("/campgrounds", function(req, res){
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
       if(err){
           console.log(err);
       } else { //console.log(body); // Show the HTML for the Modulus homepage.
                res.render("campgrounds/index",{campgrounds:allCampgrounds});}
//            request('https://maps.googleapis.com/maps/api/geocode/json?address=sardine%20lake%20ca&key=AIzaSyBtHyZ049G_pjzIXDKsJJB5zMohfN67llM', function (error, response, body) {
//             if (!error && response.statusCode == 200) {

// });}
    });
});

//CREATE - add new campground to DB
app.post("/campgrounds", isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
     console.log(req.body);
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newCampground = {name: name,price:price, image: image, description: desc, author:author}
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            console.log(author);
            res.redirect("/campgrounds");
        }
    });
});

//NEW - show form to create new campground
app.get("/campgrounds/new", isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
app.get("/campgrounds/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground)
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

app.get("/campgrounds/:id/edit", rights, function(req, res){
    console.log("IN EDIT!");
    //find the campground with provided ID
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/edit", {campground: foundCampground});
        }
    });
});

app.put("/campgrounds/:id", function(req, res){
    var newData = {name: req.body.name, image: req.body.image,price:req.body.price, description: req.body.description};
    Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});
//delete a campground
app.delete("/campgrounds/:id",function(req,res){
	Campground.findByIdAndRemove(req.params.id,function(err,foundcampground){
		if(err){console.log(err);}
		else{req.flash("success", "Your Campground has deleted " );
				res.redirect("/campgrounds");
			}
	});
});

app.get("/campgrounds/:id/comments/new", isLoggedIn, function(req, res){
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
app.post("/campgrounds/:id/comments/",isLoggedIn,function(req, res){
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
               console.log(comment.author.id,req.user.username);
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

app.get("/campgrounds/:id/comments/:commentId/edit", isLoggedIn, function(req, res){
    // find campground by id
    Comment.findById(req.params.commentId, function(err, comment){
        if(err){
            console.log(err);
        } else {
             res.render("comments/edit", {campground_id: req.params.id, comment: comment});
        }
    })
});

app.put("/campgrounds/:id/comments/:commentId", function(req, res){
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, comment){
       if(err){
           res.render("edit");
       } else {
           res.redirect("/campgrounds/" + req.params.id);
       }
   }); 
});

app.delete("/campgrounds/:id/comments/:commentId",commentrights, function(req, res){
    Comment.findByIdAndRemove(req.params.commentId, function(err){
        if(err){
            console.log("PROBLEM!");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
});
app.get("/register", function(req, res){
   res.render("register"); 
});

//handle sign up logic
app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            req.flash("error", err.message);
            res.redirect("/register");
        }else{  passport.authenticate("local")(req, res, function(){
                req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
                res.redirect("/campgrounds"); 
                });
              }
            });
});

//show login form
app.get("/login", function(req, res){
  res.render("login"); 
});

//handling login logic
app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){
});

// logout route
app.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "LOGGED YOU OUT!");
   res.redirect("/campgrounds");
});




//middleware
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    else{
      req.flash("error", "You need to be logged in to do that");
      res.redirect("/login");
      // if(req.user.password.equals(req.body.password) || req.user.username.equals(req.body.username)){
      //   return next();
      // }
      // req.flash("error", "Password or Username is incorrect");
      // res.redirect("/login");
    }
    
}

function rights(req,res,next)
{
    if(req.isAuthenticated())
    {
        Campground.findById(req.params.id,function(err,campground){
        if (err) 
        {
            req.flash("error", "Campground not found");
            res.redirect("back");
        }
        else
        {
            if(campground.author.id.equals(req.user._id)){next();}/*wedont use === because author.id is object and req.user._is is string*/
            else
            {
                req.flash("error", "You don't have permission to do that");
                res.redirect("back");
            }
        }
        });
    }
        else
        {
            req.flash("error", "You need to be logged in to do that");
            res.redirect("back");
        }
}
function commentrights(req,res,next){
  if(req.isAuthenticated()){
    Comment.findById(req.params.commentId,function(err,comment){
    	console.log(comment);
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

app.listen(3030, function(){
   console.log("The YelpCamp Server Has Started! on port 3030");
});

