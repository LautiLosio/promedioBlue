const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

// API endpoint to fetch data from
const API_ENDPOINT = 'https://api.example.com/data';

// Firestore collection to store the data in
const COLLECTION_NAME = 'dolarHistory';

// Function to fetch data from the API and store it in Firestore
async function fetchDataAndStoreInFirestore() {
  try {
    // Make API request to fetch data
    const response = await axios.get(API_ENDPOINT);

    // Store data in Firestore
    const firestore = admin.firestore();
    const collectionRef = firestore.collection(COLLECTION_NAME);
    const data = response.data;
    await collectionRef.add(data);

    console.log('Data stored in Firestore successfully!');
  } catch (error) {
    console.error('Error fetching data from API or storing in Firestore:', error);
  }
}

// Call the function to fetch data from the API and store it in Firestore
fetchDataAndStoreInFirestore();
