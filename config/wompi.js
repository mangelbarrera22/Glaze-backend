const axios = require('axios');

const wompiClient = axios.create({
  baseURL: process.env.WOMPI_BASE_URL,
  headers: {
    'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
    'Content-Type': 'application/json'
  }
});

module.exports = wompiClient;