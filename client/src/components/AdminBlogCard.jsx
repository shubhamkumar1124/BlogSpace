import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/UseAppContext';
import toast from 'react-hot-toast';
import { toExcerpt } from '../utils/html';

const AdminBlogCard = ({ blog }) => {
    const { axios, fetchBlogs } = useAppContext();
    const { title, description, category, image, _id } = blog;
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        try {
            setDeleting(true);
            const { data } = await axios.delete(`/api/admin/deleteBlog/${_id}`);
            if (data.success) {
                fetchBlogs();
                toast.success("Blog deleted successfully");
                navigate('/myBlog');
            } else {
                toast.error(`Failed to delete: ${data.message}`);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setDeleting(false);
            setShowModal(false);
        }
    };

    return (
        <>
            {/* Custom Delete Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                >
                    <div className="bg-white rounded-2xl p-8 shadow-2xl border border-teal-100 w-full max-w-sm mx-4 text-center">
                        {/* Icon */}
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10 11v6M14 11v6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Blog?</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Are you sure you want to delete <span className="font-semibold text-gray-700">"{title.length > 40 ? title.slice(0, 40) + '...' : title}"</span>? This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 border-2 border-teal-200 text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition cursor-pointer text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition cursor-pointer text-sm"
                            >
                                {deleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-teal-50 flex flex-col h-full">
                <img
                    onClick={() => navigate(`/blog/${_id}`)}
                    src={image}
                    alt={title}
                    className="w-full object-cover cursor-pointer"
                    style={{ height: '180px' }}
                />
                <div className="p-4 flex flex-col flex-grow">
                    <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full self-start mb-2">
                        {category}
                    </span>
                    <h5 className="font-bold text-gray-800 text-sm mb-2 leading-snug">
                        {title.length > 60 ? title.slice(0, 60) + '...' : title}
                    </h5>
                    <p className="text-gray-500 text-xs leading-relaxed flex-grow">
                        {toExcerpt(description, 80)}
                    </p>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => navigate(`/editBlog/${_id}`)}
                            className="flex-1 bg-gradient-to-br from-teal-600 to-teal-700 text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90 transition cursor-pointer"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex-1 border border-red-300 text-red-500 text-sm font-semibold py-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminBlogCard;