require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const {Employee, EmployeeSalary, sequelize } = require("./db");
const utility = require('./util');

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.disable("etag");

app.use(
  session({
    secret: "nishitsecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());


const signUpstrategy = new LocalStrategy(
    {
      usernameField: "employee_id",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, employee_id, password, done) => {

        const employee = {
            employee_id: req.body.employee_id,
            first_name:req.body.first_name,
            last_name: req.body.last_name,
            date_of_birth: req.body.date_of_birth,
            password: req.body.password,
            contact_number: req.body.contact_number,
        }
        let [err, newEmployee]  = await utility.invoker(Employee.create(employee))
        console.log(err, newEmployee);
        if(err || !newEmployee) {
            return done(null, false);
        }

        const employee_salary = {
            employee_id: req.body.employee_id,
            job_role: req.body.job_role,
            monthly_salary: req.body.monthly_salary,
            yearly_bonus: req.body.yearly_bonus
        }

        let newSalary 
        [err, newSalary]= await utility.invoker(EmployeeSalary.create(employee_salary));
        if(err || !newSalary) {
            return done(null, false);
        }

        return done(null,{...newEmployee.get(), ...newSalary.get()});
        
    }
);

passport.use(
  "local-signup",
  signUpstrategy
);

const signInStrategy =  new LocalStrategy(
    {
      usernameField: "employee_id",
      passwordField: "password",
      passReqToCallback: true, // allows us to pass back the entire request to the callback
    },
   async (_req, employee_id, password, done) => {
        let [err, employee] = await utility.invoker(Employee.findOne({where: {employee_id}}));
        if(err) {
            return done(null, false, {message: "Not able to login"});
        }

        if(!employee) {
            return done(null, false, {message: "No employee exists"});
        }

        if(employee.password!==password) {
            return done(null, false, {
                message: "Incorrect password.",
              });
        }
        
        return done(null, employee.get());
    
    }
  );

passport.use(
  "local-signin",
  signInStrategy
);

passport.serializeUser((employee, done) => done(null, employee.employee_id));

passport.deserializeUser(async (employee_id, done) => {

    let [err, employee] = await utility.invoker(Employee.findOne({where: {employee_id}}));
 
    if (employee) {
      done(null, employee.get());
    } else {
      done(employee.errors, null);
    }
});

app.get("/", (req, res) => {
  res.render("home");
});
app.get("/report", async (req, res)=> {
    if (req.isAuthenticated()) { 
      res.render("reports", {employee: req.user});
    } else {
      res.redirect("/login");
    }
  });

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", function (req, res) {
  res.render("register");
});


app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.post(
  "/signup",
  passport.authenticate("local-signup", {
    successRedirect: "/reports",
    failureRedirect: "/register",
  })
);

app.post(
  "/login",
  passport.authenticate("local-signin", {
    successRedirect: "/report",
    failureRedirect: "/login",
  })
  
);

const getData = async (req, res) => {
    const employee_id = req.query.employee_id;
    let [err, employee_salary] = await utility.invoker(EmployeeSalary.findOne({where: {employee_id}}));
    if(err || !employee_salary) {
        return res.send("Employee not found");
    }
    let employee_data;
    [err, employee_data] = await utility.invoker(Employee.findOne({where:{employee_id}}));
    if(err || !employee_data) {
        return res.send("Employee not found");
    }
    res.render( "search", {employee:{...employee_data.get(), ...employee_salary.get()}});
}

app.get("/salary", (req, res)=> 
    getData(req, res)
);

app.get("/updateSalary", (req, res)=>

    res.render("updateDetails")
)


const updateSalary = async (req, res)=> {
    const employee_id = req.body.employee_id;
    const monthly_salary = req.body.monthly_salary;
    const yearly_bonus = req.body.yearly_bonus;
    let [err, employee_salary] = await utility.invoker(EmployeeSalary.findOne({where:{employee_id}}));

    if(!err && employee_salary)
    {
        employee_salary.update({monthly_salary, yearly_bonus});
    }

    return res.redirect("/updateSalary");

};

app.post("/updateSalary", (req, res)=>

    updateSalary(req, res)
)

async function main() {
  await sequelize.sync();

  app.listen(3000, function () {
    console.log("Server started on port 3000");
  });
}

module.exports = main;
