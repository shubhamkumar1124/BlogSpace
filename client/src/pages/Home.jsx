import { useEffect, useState } from "react";
import { useAppContext } from "../context/UseAppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BlogCard from "../components/BlogCard";

const Home = () => {
    const categories = ["All", "Technology", "Startup", "Lifestyle", "Finance"];
    const { axios } = useAppContext();

    const [blogs, setBlogs] = useState([]);
    const [search, setSearch] = useState("");
    const [inputVal, setInputVal] = useState("");
    const [category, setCategory] = useState("All");
    const [loading, setLoading] = useState(false);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search.trim()) params.search = search;
            if (category !== "All") params.category = category;
            const { data } = await axios.get("/api/blog", { params });
            setBlogs(data.blogs);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBlogs(); }, [search, category]);

    return (
        <div className="flex flex-col min-h-screen" style={{
            background: '#edf7f5',
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(13,148,136,0.04) 0px, rgba(13,148,136,0.04) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, rgba(13,148,136,0.03) 0px, rgba(13,148,136,0.03) 1px, transparent 1px, transparent 20px)',
        }}>
            <Navbar />

            <main className="flex-grow">
                {/* Hero */}
                <div className="relative overflow-hidden text-center px-5 pt-16 pb-12">

                    {/* Blobs */}
                    <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
                        style={{ background: 'rgba(13,148,136,0.05)', top: '-180px', left: '50%', transform: 'translateX(-50%)', filter: 'blur(80px)' }}
                    />
                    <div className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
                        style={{ background: 'rgba(13,148,136,0.04)', top: '20px', right: '8%', filter: 'blur(60px)' }}
                    />
                    <div className="absolute w-[250px] h-[250px] rounded-full pointer-events-none"
                        style={{ background: 'rgba(13,148,136,0.04)', top: '20px', left: '8%', filter: 'blur(60px)' }}
                    />

                    {/* Rings */}
                    <div className="absolute rounded-full pointer-events-none"
                        style={{ width: '650px', height: '650px', border: '1px solid rgba(13,148,136,0.08)', top: '-220px', left: '50%', transform: 'translateX(-50%)' }}
                    />
                    <div className="absolute rounded-full pointer-events-none"
                        style={{ width: '450px', height: '450px', border: '1px solid rgba(13,148,136,0.07)', top: '-120px', left: '50%', transform: 'translateX(-50%)' }}
                    />
                    <div className="absolute rounded-full pointer-events-none"
                        style={{ width: '250px', height: '250px', border: '1px solid rgba(13,148,136,0.06)', top: '-30px', left: '50%', transform: 'translateX(-50%)' }}
                    />

                    <div className="relative z-10">
                        {/* Badge */}
                        <span className="inline-block bg-white/80 backdrop-blur-sm border border-teal-300 text-teal-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
                            ✦ AI content generation integrated
                        </span>

                        {/* Heading */}
                        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mt-6 leading-tight tracking-tight">
                            Your own <span className="text-teal-600">blogging</span>
                            <br />platform.
                        </h1>

                        {/* Subtext */}
                        <p className="text-gray-600 text-base mt-5 max-w-lg mx-auto leading-relaxed">
                            Your space to think out loud, share what matters, and write without filters.
                            Your story starts right here.
                        </p>

                        {/* Search */}
                        <div className="flex justify-center mt-8 max-w-md mx-auto">
                            <input
                                type="text"
                                placeholder="Search for blogs..."
                                value={inputVal}
                                onChange={(e) => setInputVal(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && setSearch(inputVal)}
                                className="flex-grow px-5 py-3 border-2 border-teal-200 border-r-0 rounded-l-full text-sm outline-none bg-white/80 text-gray-700 backdrop-blur-sm"
                            />
                            <button
                                onClick={() => setSearch(inputVal)}
                                className="px-6 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white text-sm font-semibold rounded-r-full shadow-md hover:opacity-90 transition cursor-pointer"
                            >
                                Search
                            </button>
                            {search && (
                                <button
                                    onClick={() => { setSearch(''); setInputVal(''); }}
                                    className="ml-2 px-4 py-3 border-2 border-teal-300 text-teal-700 text-sm font-medium rounded-full hover:bg-white/60 transition cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Categories */}
                        <div className="flex justify-center flex-wrap gap-2 mt-6">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`px-5 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
                                        category === cat
                                            ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-md'
                                            : 'text-teal-800 hover:bg-white/60'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Blog Cards */}
                <div className="max-w-6xl mx-auto px-6 pb-16">
                    {loading ? (
                        <div className="text-center py-20 text-teal-600 text-lg">Loading blogs...</div>
                    ) : blogs.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="text-5xl mb-4">📭</div>
                            <h3 className="text-gray-600 font-semibold text-lg">No blogs found</h3>
                            <p className="text-gray-400 mt-2 text-sm">Try a different search or category</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                            {blogs.map((blog) => (
                                <BlogCard key={blog._id} blog={blog} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Home;