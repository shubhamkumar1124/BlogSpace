import { Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import 'quill/dist/quill.snow.css';
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import Signup from "./pages/SignUp";
import Login from "./pages/Login";
import AddBlog from "./pages/AddBlog";
import MyBlog from "./pages/MyBlog";
import EditBlog from "./pages/EditBlog";

const App = () => {
  return (
    <div>
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/blog/:id" element={<Blog />} />
        <Route path="/addBlog" element={<AddBlog />} />
        <Route path="/myBlog" element={<MyBlog />} />
        <Route path="/editBlog/:id" element={<EditBlog />} />
      </Routes >
    </div >
  );
};

export default App;
