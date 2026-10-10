import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import { useAppContext } from '../context/UseAppContext';
import toast from 'react-hot-toast';
import { parse } from 'marked';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function AddBlog() {
    const blogCategories = ['Technology', 'Startup', 'Lifestyle', 'Finance'];
    const { axios, fetchBlogs } = useAppContext();

    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [title, setTitle] = useState('');
    const [subTitle, setSubTitle] = useState('');
    const [category, setCategory] = useState('');

    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const fileInputRef = useRef(null);

    const generateContent = async () => {
        if (!title) { toast.error('Please enter a title'); return; }
        try {
            setLoading(true);
            const { data } = await axios.post('/api/admin/generateContent', { prompt: title });
            if (data.success) quillRef.current.root.innerHTML = parse(data.content);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            setIsAdding(true);
            const blog = { title, subTitle, description: quillRef.current.root.innerHTML, category };
            const formData = new FormData();
            formData.append('blog', JSON.stringify(blog));
            formData.append('image', image);
            const { data } = await axios.post('/api/admin/add', formData);
            if (data.success) {
                toast.success(data.message);
                setImage(false);
                setImagePreview(null);
                setTitle('');
                setSubTitle('');
                quillRef.current.root.innerHTML = '';
                setCategory('');
                fetchBlogs();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsAdding(false);
        }
    };

    useEffect(() => {
        if (!quillRef.current && editorRef.current) {
            quillRef.current = new Quill(editorRef.current, { theme: 'snow' });
        }
    }, []);

    return (
        <div className="flex flex-col min-h-screen" style={{
            background: '#edf7f5',
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(13,148,136,0.04) 0px, rgba(13,148,136,0.04) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, rgba(13,148,136,0.03) 0px, rgba(13,148,136,0.03) 1px, transparent 1px, transparent 20px)',
        }}>
            <Navbar />
            <div className="max-w-3xl mx-auto w-full px-6 py-10">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-8">
                    Create <span className="text-teal-600">Blog</span>
                </h2>

                <form onSubmit={onSubmitHandler} className="bg-white rounded-2xl p-8 shadow-sm border border-teal-100 flex flex-col gap-7">

                    {/* Thumbnail Upload */}
                    <div>
                        <label className="text-base font-bold text-gray-700 block mb-3">
                            Upload Thumbnail
                        </label>
                        <div
                            onClick={() => fileInputRef.current.click()}
                            className="w-28 h-28 border-2 border-dashed border-teal-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50 transition overflow-hidden"
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-teal-400 mb-1">
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
                            className="w-full border border-teal-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-teal-500 transition bg-transparent"
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
                            className="w-full border border-teal-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-teal-500 transition bg-transparent"
                        />
                    </div>

                    {/* Blog Description */}
                    <div className="relative">
                        <label className="text-base font-bold text-gray-700 block mb-2">Blog Description</label>
                        <div ref={editorRef} className="border border-teal-200 rounded-xl overflow-hidden min-h-[300px]" />
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
                                <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                            </div>
                        )}
                        <button
                            type="button"
                            disabled={loading}
                            onClick={generateContent}
                            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition cursor-pointer"
                        >
                            {/* Gemini icon */}
                            <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
                                <path d="M14 28C14 26.0633 13.6267 24.2433 12.88 22.54C12.1567 20.8367 11.165 19.355 9.905 18.095C8.645 16.835 7.16333 15.8433 5.46 15.12C3.75667 14.3733 1.93667 14 0 14C1.93667 14 3.75667 13.6383 5.46 12.915C7.16333 12.1683 8.645 11.165 9.905 9.905C11.165 8.645 12.1567 7.16333 12.88 5.46C13.6267 3.75667 14 1.93667 14 0C14 1.93667 14.3617 3.75667 15.085 5.46C15.8317 7.16333 16.835 8.645 18.095 9.905C19.355 11.165 20.8367 12.1683 22.54 12.915C24.2433 13.6383 26.0633 14 28 14C26.0633 14 24.2433 14.3733 22.54 15.12C20.8367 15.8433 19.355 16.835 18.095 18.095C16.835 19.355 15.8317 20.8367 15.085 22.54C14.3617 24.2433 14 26.0633 14 28Z" fill="url(#gemini_gradient)"/>
                                <defs>
                                    <linearGradient id="gemini_gradient" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#4285F4"/>
                                        <stop offset="50%" stopColor="#9B72CB"/>
                                        <stop offset="100%" stopColor="#D96570"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                            Generate with AI
                        </button>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-base font-bold text-gray-700 block mb-2">Category</label>
                        <select
                            onChange={e => setCategory(e.target.value)}
                            value={category}
                            className="w-full border border-teal-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-teal-500 transition"
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
                        disabled={isAdding}
                        className="w-full py-3.5 bg-gradient-to-br from-teal-600 to-teal-700 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition cursor-pointer text-base"
                    >
                        {isAdding ? "Adding..." : "Add Blog"}
                    </button>
                </form>
            </div>
            <Footer />
        </div>
    );
}

export default AddBlog;