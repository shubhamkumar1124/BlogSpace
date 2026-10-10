import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Quill from 'quill';
import { useAppContext } from '../context/UseAppContext';
import toast from 'react-hot-toast';
import 'quill/dist/quill.snow.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function EditBlog() {
    const blogCategories = ['Technology', 'Startup', 'Lifestyle', 'Finance'];
    const { id } = useParams();
    const navigate = useNavigate();
    const { axios, fetchBlogs } = useAppContext();

    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const fileInputRef = useRef(null);

    const [isUpdating, setIsUpdating] = useState(false);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [title, setTitle] = useState('');
    const [subTitle, setSubTitle] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => {
        if (!quillRef.current && editorRef.current) {
            quillRef.current = new Quill(editorRef.current, { theme: 'snow' });
        }
    }, []);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const { data } = await axios.get(`/api/blog/${id}`);
                if (data.success) {
                    const blog = data.blog;
                    setTitle(blog.title);
                    setSubTitle(blog.subTitle);
                    setCategory(blog.category);
                    setImagePreview(blog.image);
                    if (quillRef.current) {
                        quillRef.current.root.innerHTML = blog.description;
                    }
                } else {
                    toast.error(data.message);
                }
            } catch {
                toast.error("Failed to fetch blog");
            }
        };
        fetchBlog();
    }, [id]);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const blog = {
                title,
                subTitle,
                description: quillRef.current.root.innerHTML,
                category,
            };
            const formData = new FormData();
            formData.append('blog', JSON.stringify(blog));
            if (image) formData.append('image', image);

            const { data } = await axios.put(`/api/admin/updateBlog/${id}`, formData);
            if (data.success) {
                toast.success(data.message);
                navigate('/');
                fetchBlogs();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen" style={{
            background: '#edf7f5',
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(13,148,136,0.04) 0px, rgba(13,148,136,0.04) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, rgba(13,148,136,0.03) 0px, rgba(13,148,136,0.03) 1px, transparent 1px, transparent 20px)',
        }}>
            <Navbar />

            <div className="max-w-3xl mx-auto w-full px-6 py-10">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-8">
                    Edit <span className="text-teal-600">Blog</span>
                </h2>

                <form onSubmit={onSubmitHandler} className="bg-white rounded-2xl p-8 shadow-sm border border-teal-100 flex flex-col gap-7">

                    {/* Thumbnail */}
                    <div>
                        <label className="text-base font-bold text-gray-700 block mb-3">
                            Upload Thumbnail
                        </label>
                        <div
                            onClick={() => fileInputRef.current.click()}
                            className="w-28 h-28 border-2 border-dashed border-teal-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50 transition overflow-hidden"
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mb-1">
                                        <path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M20 16.7A4 4 0 0018 9h-1.26A8 8 0 104 15.3" stroke="#0d9488" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    <span className="text-xs font-semibold text-teal-500">Upload</span>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                setImage(file);
                                setImagePreview(URL.createObjectURL(file));
                            }}
                        />
                    </div>

                    {/* Blog Title */}
                    <div>
                        <label className="text-base font-bold text-gray-700 block mb-2">Blog Title</label>
                        <input
                            type="text"
                            placeholder="Type here"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            className="w-full border border-teal-600 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-teal-800 transition bg-transparent"
                        />
                    </div>

                    {/* Blog Subtitle */}
                    <div>
                        <label className="text-base font-bold text-gray-700 block mb-2">Blog Subtitle</label>
                        <input
                            type="text"
                            placeholder="Type here"
                            value={subTitle}
                            onChange={e => setSubTitle(e.target.value)}
                            required
                            className="w-full border border-teal-600 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-teal-800 transition bg-transparent"
                        />
                    </div>

                    {/* Blog Description */}
                    <div className="relative">
                        <label className="text-base font-bold text-gray-700 block mb-2">Blog Description</label>
                        <div ref={editorRef} className="border border-teal-600 rounded-xl overflow-hidden min-h-[300px]" />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-base font-bold text-gray-700 block mb-2">Category</label>
                        <select
                            onChange={e => setCategory(e.target.value)}
                            value={category}
                            className="w-full border border-teal-600 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-teal-800 transition"
                        >
                            <option value="">Select category</option>
                            {blogCategories.map((item, i) => (
                                <option key={i} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isUpdating}
                        className="w-full py-3.5 bg-gradient-to-br from-teal-600 to-teal-700 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition cursor-pointer text-base"
                    >
                        {isUpdating ? "Updating..." : "Update Blog"}
                    </button>
                </form>
            </div>

            <Footer />
        </div>
    );
}

export default EditBlog;