import Navbar from '../components/Navbar';
import { useAppContext } from '../context/UseAppContext';
import AdminBlogCard from '../components/AdminBlogCard';
import Footer from '../components/Footer';

function MyBlog() {
    const { blogs, user } = useAppContext();
    const userId = user?.userId;
    const myBlogs = blogs.filter(blog => blog.author === userId);

    return (
        <div className="flex flex-col min-h-screen bg-teal-50">
            <Navbar />
            <main className="flex-grow py-10">
                <div className="max-w-6xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-8">
                        My <span className="text-teal-600">Blogs</span>
                    </h2>
                    {myBlogs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {myBlogs.map((blog) => (
                                <AdminBlogCard key={blog._id} blog={blog} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24">
                            <div className="text-5xl mb-4">✍️</div>
                            <h3 className="text-gray-600 font-semibold text-lg">No blogs yet</h3>
                            <p className="text-gray-400 mt-2 text-sm">Start writing your first blog!</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default MyBlog;