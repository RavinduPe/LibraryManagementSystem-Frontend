import axios from 'axios';
import.meta.env.VITE_MY_VAR

const api = axios.create({
    baseURL: import.meta.env.BASEURL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

export default api;