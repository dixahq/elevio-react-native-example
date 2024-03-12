import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View, TouchableHighlight } from "react-native";
import Elevio from "./Elevio";

export default function App() {
  const elevioRef = useRef();
  useEffect(() => {
    elevioRef.current.initialize("58f572246b738", { email: "test@elev.io" });
  }, []);

  return (
    <View style={styles.container}>
      <Elevio ref={elevioRef} />
      <Text>Open up App.js to start working on your app!</Text>

      <TouchableHighlight
        style={styles.elevioButton}
        onPress={() => {
          elevioRef.current.show("page");
        }}
      >
        <Text>Elevio</Text>
      </TouchableHighlight>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  elevioButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "lightblue",
  },
});
