const express = require('express');
const identifyRoute = require('./routes/identify');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.use('/identify', identifyRoute);

module.exports = app;
