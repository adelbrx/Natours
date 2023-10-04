const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel');

////////////////////////////////////////
dotenv.config({ path: './config.env' });
////////////////////////////////////////
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

//CONNECTING TO DB
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((connexion) => {
    console.log('DB connection successfull!');
  });

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

//IMPORTING DATA TO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully loaded!');
  } catch (error) {
    console.log(error);
  }
};

//DELETE ALL DATA FROM COLLECTION IN DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfully deleted!');
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

console.log(process);
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
