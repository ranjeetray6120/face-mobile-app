import axios from 'axios';

// Development: Point to the backend server
// Production: Relative path since it will be served by Spring Boot (potentially)
// For now, we hardcode the backend IP for local dev from mobile
const API_BASE_URL = 'https://api.decointerior.in/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export { API_BASE_URL };
export default api;
