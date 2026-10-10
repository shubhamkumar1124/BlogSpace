import { createContext, useEffect, useState } from "react";
import axios from "axios";

// Empty base URL = same origin: the Vite dev proxy (local) or the Express
// server that serves this build (production). Set VITE_BASE_URL only if the
// API lives on a different domain.
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "";
axios.defaults.withCredentials = true;

// Show the server's error message (e.g. "Invalid credentials") instead of
// axios's generic "Request failed with status code 401".
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const serverMessage = error.response?.data?.message;
        if (serverMessage) error.message = serverMessage;
        return Promise.reject(error);
    }
);

// Create context for the app
export const AppContext = createContext();

// Provider component for the app context
export const AppProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [blogs, setBlogs] = useState([]);
    const fetchBlogs = async () => {
        try {
            const { data } = await axios.get("/api/blog/all");
            data.success ? setBlogs(data.blogs) : console.error(data.message);
        } catch (error) {
            console.error("Error fetching blogs:", error);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const value = {
        axios,
        user,
        setUser,
        blogs,
        setBlogs,
        fetchBlogs,
    };
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
