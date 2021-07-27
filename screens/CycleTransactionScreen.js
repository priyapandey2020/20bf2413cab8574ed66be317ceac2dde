import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Alert
} from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as firebase from "firebase";
import db from "../config.js";

export default class TransactionScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedCycleId: "",
      scannedStudentId: "",
      buttonState: "normal",
      transactionMessage: ""
    };
  }

  getCameraPermissions = async id => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      hasCameraPermissions: status === "granted",
      buttonState: id,
      scanned: false
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    const { buttonState } = this.state;

    if (buttonState === "CycleId") {
      this.setState({
        scanned: true,
        scannedCycleId: data,
        buttonState: "normal"
      });
    } else if (buttonState === "StudentId") {
      this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: "normal"
      });
    }
  };

  initiateCycleIssue = async () => {
   
    // db.collection("transactions").add({
    //   studentId: this.state
    //   cycleId: this.state.scannedCycleId,
    //   date: firebase.firestore,
    //   transactionType: "Issue"
    // });

    // db.collection("transactions").add({
    //   studentId: this.state.scannedStudentId
    //   cycleId: this.state.scannedCycleId
    //   date: firebase.firestore.Timestamp.now().toDate()
    //   transactionType: "Issue"
    // });

    db.collection("transactions").add({
      studentId: this.state.scannedStudentId,
      cycleId: this.state.scannedCycleId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: "Issue"
    });

    // db.collection("transactions").({
    //   studentId: this.state.scannedStudentId;
    //   cycleId: this.state.scannedCycleId;
    //   date: firebase.firestore.Timestamp.now().toDate();
    //   transactionType: "Issue";
    // });
  
   var cycleissue = db.collection("cycle")
   cycleissue.where("cycleId","==", this.state.scannedCycleId).get()
   .then((snapshot)=>{
     snapshot.forEach((doc)=>{
       cycleissue.doc(doc.id).update({
         cycleAvailability:false
       })
     })
   })

   var studentcycles = db.collection("students")
      studentcycles.where("studentId","==", this.state.scannedStudentId).get()
      .then((snapshot)=>{
        snapshot.forEach((doc)=>{
          studentcycles.doc(doc.id).update({
            numberOfCyclesIssued:firebase.firestore.FieldValue.increment(1)
          })
        })
      })

    this.setState({
      scannedStudentId: "",
      scannedCycleId: ""
    });
  };

  initiateCycleReturn = async () => {
    //add a transaction
    db.collection("transactions").add({
      studentId: this.state.scannedStudentId,
      cycleId: this.state.scannedCycleId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: "Return"
    });
    //change cycle status
   var cycleissue = db.collection("cycle")
   cycleissue.where("cycleId","==", this.state.scannedCycleId).get()
   .then((snapshot)=>{
     snapshot.forEach((doc)=>{
       cycleissue.doc(doc.id).update({
         cycleAvailability:true
       })
     })
   })

   var studentcycles = db.collection("students")
      studentcycles.where("studentId","==", this.state.scannedStudentId).get()
      .then((snapshot)=>{
        snapshot.forEach((doc)=>{
          studentcycles.doc(doc.id).update({
            numberOfCyclesIssued:firebase.firestore.FieldValue.increment(-1)
          })
        })
      })

    // this.setState({
    //   scannedStudentId: "";
    //   scannedCycleId: ""
    // });

    // this.setState({
    //   scannedStudentId: ,
    //   scannedCycleId: 
    // });

    this.setState({
      scannedStudentId: "",
      scannedCycleId: ""
    });

     // this.state({
    //   scannedStudentId: "",
    //   scannedCycleId: ""
    // });
  };

  checkCycleEligibility = async () => {
    const cycleRef = await db
      .collection("cycle")
      .where("cycleId", "==", this.state.scannedCycleId)
      .get();
    var transactionType = "";
    if (cycleRef.docs.length == 0) {
      transactionType = false;
    } else {
      cycleRef.docs.map(doc => {
        var cycle = doc.data();
        if (cycle.cycleAvailability) {
          transactionType = "Issue";
        } else {
          transactionType = "Return";
        }
      });
    }

    return transactionType;
  };

  checkStudentEligibilityForCycleIssue = async () => {
    const studentRef = await db
      .collection("students")
      .where("studentId", "==", this.state.scannedStudentId)
      .get();
    var isStudentEligible = "";
    if (studentRef.docs.length == 0) {
      this.setState({
        scannedStudentId: "",
        scannedCycleId: ""
      });
      isStudentEligible = false;
      Alert.alert("The student id doesn't exist in the database!");
    } else {
      studentRef.docs.map(doc => {
        var student = doc.data();
        if (student.numberOfCyclesIssued < 2) {
          isStudentEligible = true;
        } else {
          isStudentEligible = false;
          Alert.alert("The student has already issued 2 cycles!");
          this.setState({
            scannedStudentId: "",
            scannedCycleId: ""
          });
        }
      });
    }

    return isStudentEligible;
  };

  checkStudentEligibilityForReturn = async () => {
    const transactionRef = await db
      .collection("transactions")
      .where("cycleId", "==", this.state.scannedCycleId)
      .limit(1)
      .get();
    var isStudentEligible = "";
    transactionRef.docs.map(doc => {
      var lastCycleTransaction = doc.data();
      if (lastCycleTransaction.studentId === this.state.scannedStudentId) {
        isStudentEligible = true;
      } else {
        isStudentEligible = false;
        Alert.alert("The cycle wasn't issued by this student!");
        this.setState({
          scannedStudentId: "",
          scannedCycleId: ""
        });
      }
    });
    return isStudentEligible;
  };

  handleTransaction = async () => {
    var transactionType = await this.checkCycleEligibility();

    if (!transactionType) {
      Alert.alert("The cycle doesn't exist in the database!");
      this.setState({
        scannedStudentId: "",
        scannedCycleId: ""
      });
    } else if (transactionType === "Issue") {
      var isStudentEligible = await this.checkStudentEligibilityForCycleIssue();
      if (isStudentEligible) {
        this.initiateCycleIssue();
        Alert.alert("Cycle issued to the student!");
      }
    } else {
      var isStudentEligible = await this.checkStudentEligibilityForReturn();
      if (isStudentEligible) {
        this.initiateCycleReturn();
       // Alert("Thank you for returning it to the Schoo!");
       // alert("Thank you for returning it to the Schoo!");
       // Alert.alert(Thank you for returning it to the Schooy!);
        Alert.alert("Thank you for returning it to the Schoo!");

      }
    }
  };

  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if (buttonState !== "normal" && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    } else if (buttonState === "normal") {
      return (
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
          <View>
            <Image
              source={require("../assets/cycle.jpg")}
              style={{ width: 200, height: 200 }}
            />
            <Text style={{ textAlign: "center", fontSize: 30 }}>LET'S RIDE</Text>
          </View>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="Cycle Id"
              onChangeText={text => {
                this.setState({
                  scannedCycleId: text
                });
              }}
              value={this.state.scannedCycleId}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions("CycleId");
              }}
            >
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="Student Id"
              onChangeText={text => {
                this.setState({
                  scannedStudentId: text
                });
              }}
              value={this.state.scannedStudentId}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions("StudentId");
              }}
            >
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.transactionAlert}>
            {this.state.transactionMessage}
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={async () => {
              var transactionMessage = this.handleTransaction();
            }}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:"peachpuff"
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: "underline"
  },
  scanButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    margin: 10
  },
  buttonText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 10
  },
  inputView: {
    flexDirection: "row",
    margin: 20
  },
  inputBox: {
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20
  },
  scanButton: {
    backgroundColor: "#15169c",
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0
  },
  submitButton: {
    backgroundColor: "#15aa21",
    width: 100,
    height: 50,
    borderRadius:30
  },
  submitButtonText: {
    padding: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "white"
  },
  transactionAlert: {
    margin: 10,
    color: "red"
  }
});
