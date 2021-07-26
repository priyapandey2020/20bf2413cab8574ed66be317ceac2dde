import * as firebase from "firebase";
require("@firebase/firestore");

  var firebaseConfig = {
    apiKey: "AIzaSyDKuYqcZGaJOVJTl7wsVOG6EaTHNas-UOA",
    authDomain: "cycle-app-39658.firebaseapp.com",
    projectId: "cycle-app-39658",
    storageBucket: "cycle-app-39658.appspot.com",
    messagingSenderId: "432365679199",
    appId: "1:432365679199:web:249b550bde861bf93621ea"
  };
 
  firebase.initializeApp(firebaseConfig);

export default firebase.firestore();
