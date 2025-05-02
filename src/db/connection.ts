import mongoose from "mongoose";

export default async function connectToMongo() {
    try {
      await mongoose.connect('mongodb+srv://harshilgoti:@harshil@21@cluster0.6mqqur9.mongodb.net/habits');
      // awa mongoose.connect('mongodb+srv://harshilgoti:<db_password>@cluster0.6mqqur9.mongodb.net/?retryWrites=true&w=majority&appName=habits')
      console.log('Connected to MongoDB');
      // Perform database operations here
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    } 
  }
//   connectToMongo();