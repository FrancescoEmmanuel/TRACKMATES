import mqtt from "mqtt";



// const options = {
//   clean: true,
//   connectTimeout: 4000,
//   clientId: `buddyband-client-${Math.random().toString(16).substr(2, 8)}`,
//   username: '', 
//   password: ''
// };

const brokerUrl = "wss://broker.emqx.io:8084/mqtt"; // Use secure WebSocket
const options = {
  username: "eqmx", // Optional for public brokers
  password: "public",
  keepalive: 20,
  clientId: "buddyband-client-" + Math.random().toString(16).substr(2, 8),
};

const client = mqtt.connect(brokerUrl, options);

client.on("connect", () => {
  console.log("MQTT Connected");
});

client.on("error", (err) => {
  console.error("MQTT Connection Error:", err);
});

export default client;
