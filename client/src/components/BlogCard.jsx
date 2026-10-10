import { useNavigate } from 'react-router-dom';
import { toExcerpt } from '../utils/html';

const BlogCard = ({ blog }) => {
    const { title, description, category, image, _id } = blog;
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/blog/${_id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-teal-50 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col"
        >
            <img
                src={image}
                alt={title}
                className="w-full object-cover"
                style={{ aspectRatio: '16/9' }}
            />
            <div className="p-5 flex flex-col flex-grow">
                <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full self-start mb-3">
                    {category}
                </span>
                <h5 className="font-bold text-gray-800 text-base mb-2 leading-snug">
                    {title.length > 60 ? title.slice(0, 60) + '...' : title}
                </h5>
                <p className="text-gray-500 text-sm leading-relaxed">
                    {toExcerpt(description, 120)}
                </p>
            </div>
        </div>
    );
};

export default BlogCard;