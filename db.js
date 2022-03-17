const { Model, DataTypes, Sequelize } = require("@sequelize/core");

const sequelize = new Sequelize(
    "postgres://postgres:postgres@localhost:5432/test"
);

class Employee extends Model { }
Employee.init(
    {
        employee_id: DataTypes.STRING,
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        date_of_birth: DataTypes.STRING,
        password: DataTypes.STRING,
        contact_number: DataTypes.STRING,
    },
    { sequelize, modelName: "nishit_111915080_detail" }
);

class EmployeeSalary extends Model { }
EmployeeSalary.init(
    {
        employee_id: DataTypes.STRING,
        job_role: DataTypes.STRING,
        monthly_salary: DataTypes.INTEGER,
        yearly_bonus: DataTypes.INTEGER

    },
    { sequelize, modelName: "nishit_111915080_salary" }
);

module.exports = { Employee, EmployeeSalary, sequelize };
