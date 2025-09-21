import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/db/db.config.js';

dotenv.config();

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Server error:", error);
      throw error;
    });
    app.listen(process.env.PORT || 5000, () => {
      console.log(`\n Server is running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connected failed !!!", error);
});