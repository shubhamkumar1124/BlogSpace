import { useEffect, useState } from "react";
import moment from "moment";
import { useParams } from "react-router-dom";
import Loader from "../components/Loader";
import { useAppContext } from "../context/UseAppContext";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import ChatBot from '../components/ChatBot';
import { safeHtml } from "../utils/html";

const Blog = () => {
    const { id } = useParams();
    const { axios } = useAppContext();
    const [data, setData] = useState(null);

    const fetchBlogData = async () => {
        try {
            const { data } = await axios.get(`/api/blog/${id}`);
            data.success ? setData(data.blog) : console.error(data.message);
        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        fetchBlogData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]); // refetch when moving from one blog to another

    return data ? (
        <div className="flex flex-col min-h-screen" style={{
            background: '#edf7f5',
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(13,148,136,0.04) 0px, rgba(13,148,136,0.04) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, rgba(13,148,136,0.03) 0px, rgba(13,148,136,0.03) 1px, transparent 1px, transparent 20px)',
        }}>
            <Navbar />

            {/* Hero Header */}
            <div className="relative overflow-hidden text-center px-6 pt-14 pb-10">

                {/* Blobs */}
                <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'rgba(13,148,136,0.05)', top: '-180px', left: '50%', transform: 'translateX(-50%)', filter: 'blur(80px)' }}
                />
                <div className="absolute rounded-full pointer-events-none"
                    style={{ width: '600px', height: '600px', border: '1px solid rgba(13,148,136,0.08)', top: '-200px', left: '50%', transform: 'translateX(-50%)' }}
                />
                <div className="absolute rounded-full pointer-events-none"
                    style={{ width: '400px', height: '400px', border: '1px solid rgba(13,148,136,0.06)', top: '-100px', left: '50%', transform: 'translateX(-50%)' }}
                />

                <div className="relative z-10 max-w-3xl mx-auto">

                    {/* Published date */}
                    <p className="text-teal-600 font-semibold text-sm tracking-wide uppercase mb-4">
                        ✦ Published on {moment(data.createdAt).format("MMMM Do YYYY")}
                    </p>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
                        {data.title}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-gray-500 text-lg mb-6 leading-relaxed">
                        {data.subTitle}
                    </p>

                    {/* Author bubble */}
                    <span className="inline-block bg-teal-700 text-white text-sm font-semibold px-5 py-2 rounded-full shadow-md">
                        {data.author.name}
                    </span>
                </div>
            </div>

            {/* Blog Image */}
            <div className="flex justify-center px-6 mb-10">
                <img
                    src={data.image}
                    alt={data.title}
                    className="rounded-2xl shadow-lg w-full object-cover"
                    style={{ maxWidth: '750px', maxHeight: '460px' }}
                />
            </div>

            {/* Blog Content */}
            <div className="max-w-3xl mx-auto px-6 pb-16">
                <div
                    className="bg-white rounded-2xl p-8 shadow-sm border border-teal-100 rich-text"
                    dangerouslySetInnerHTML={{ __html: safeHtml(data.description) }}
                />
            </div>

            <ChatBot blogId={id} blogTitle={data.title} />

            <Footer />
        </div>
    ) : (
        <Loader />
    );
};

export default Blog;