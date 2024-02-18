const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

////////////////////////////////////////
dotenv.config({ path: './config.env' });
////////////////////////////////////////
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((connexion) => {
    console.log('DB connection successfull!');
  });
////////////////////////////////////////

////////////////////////////////////////
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
