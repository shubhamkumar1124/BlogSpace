import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAppContext } from "../context/UseAppContext";
import { useEffect } from "react";
import toast from "react-hot-toast";

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { axios, user, setUser } = useAppContext();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('/api/blog/profile');
                setUser(response.data);
            } catch {
                setUser(null);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post('/api/blog/logout');
            setUser(null);
            toast.success("Logout successful");
            navigate('/');
        } catch (error) {
            toast.error(`Logout failed: ${error.message}`);
        }
    };

    const userId = user?.userId;
    const isActive = (path) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 px-10 py-4 flex justify-between items-center"
            style={{
                background: 'linear-gradient(135deg, #ccf0eb 0%, #e0f7f4 50%, #c8ede8 100%)',
                borderBottom: '1.5px solid rgba(13,148,136,0.2)',
                boxShadow: '0 2px 20px rgba(13,148,136,0.12)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            
            {/* Diagonal lines */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(13,148,136,0.06) 0px, rgba(13,148,136,0.06) 1px, transparent 1px, transparent 12px)',
                pointerEvents: 'none',
            }} />
            {/* Glow blobs */}
            <div style={{
                position: 'absolute', width: '200px', height: '200px',
                borderRadius: '50%', background: 'rgba(13,148,136,0.15)',
                top: '-80px', left: '-40px', filter: 'blur(50px)', pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', width: '200px', height: '200px',
                borderRadius: '50%', background: 'rgba(13,148,136,0.12)',
                top: '-80px', right: '-40px', filter: 'blur(50px)', pointerEvents: 'none'
            }} />

            {/* Brand with Logo */}
            <div
                onClick={() => navigate("/")}
                className="flex items-center gap-2.5 cursor-pointer relative z-10"
            >
                <div style={{
                    width: '36px', height: '36px',
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(13,148,136,0.35)',
                    flexShrink: 0,
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9"/>
                        <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
                        <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    </svg>
                </div>
                <span className="text-teal-800 font-extrabold text-xl tracking-tight">
                    BlogSpace
                </span>
            </div>

            {/* Nav Links */}
            <div className="flex items-center gap-2 relative z-10">
                {userId ? (
                    <>
                        <Link
                            to="/addBlog"
                            className={`text-sm font-semibold px-4 py-2 rounded-lg transition no-underline ${
                                isActive('/addBlog')
    ? 'bg-teal-600 text-white shadow-md'
    : 'text-gray-800 hover:bg-teal-200/60 hover:border-1 hover:border-teal-700 border-2 border-transparent'
                            }`}
                        >
                            Create Blog
                        </Link>
                        <Link
                            to="/myBlog"
                            className={`text-sm font-semibold px-4 py-2 rounded-lg transition no-underline ${
                                isActive('/myBlog')
    ? 'bg-teal-600 text-white shadow-md'
    : 'text-gray-800 hover:bg-teal-200/60 hover:border-1 hover:border-teal-700 border-2 border-transparent'
                            }`}
                        >
                            My Blogs
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="border-2 border-red-500 text-red-600 bg-white/70 text-sm font-bold px-5 py-2 rounded-full hover:bg-red-500 hover:text-white transition cursor-pointer"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-gradient-to-br from-teal-600 to-teal-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        Login →
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;