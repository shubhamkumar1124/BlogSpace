import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../context/UseAppContext';

const Signup = () => {
    const { axios } = useAppContext();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/api/blog/signup', { name, email, password });
            if (data.success) {
                toast.success('Account created! You can now log in.');
                navigate('/login');
            } else {
                toast.error(data.message || 'Signup failed');
            }
        } catch (error) {
            toast.error(error.message || 'Something went wrong');
        }
    };

    return (
        <div className="min-h-screen bg-teal-50 flex items-center justify-center relative overflow-hidden">
            {/* Blobs */}
            <div className="absolute w-[400px] h-[400px] rounded-full border border-teal-200/25 -top-24 -left-24 pointer-events-none" />
            <div className="absolute w-[300px] h-[300px] rounded-full border border-teal-200/20 -top-12 -left-12 pointer-events-none" />
            <div className="absolute w-[350px] h-[350px] rounded-full border border-teal-200/20 -bottom-20 -right-20 pointer-events-none" />
            <div className="absolute w-[500px] h-[500px] rounded-full border border-teal-200/10 -bottom-36 -right-36 pointer-events-none" />
            <div className="absolute w-[220px] h-[220px] rounded-full bg-teal-200/20 top-16 right-20 blur-[40px] pointer-events-none" />
            <div className="absolute w-[180px] h-[180px] rounded-full bg-teal-200/15 bottom-20 left-16 blur-[40px] pointer-events-none" />

            {/* Card */}
            <div className="bg-white rounded-2xl px-10 py-12 w-full max-w-md shadow-lg border border-teal-100 relative z-10">
                <h2 className="text-center text-2xl font-bold mb-1">
                    <span className="text-teal-600">Admin</span> Signup
                </h2>
                <p className="text-center text-gray-400 text-sm mb-8">
                    Create your account to access the admin panel
                </p>

                <div className="mb-6">
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Name</label>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full border-b border-teal-200 outline-none py-2 text-sm bg-transparent text-gray-700 focus:border-teal-600 transition"
                    />
                </div>

                <div className="mb-6">
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Email</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full border-b border-teal-200 outline-none py-2 text-sm bg-transparent text-gray-700 focus:border-teal-600 transition"
                    />
                </div>

                <div className="mb-8">
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full border-b border-teal-200 outline-none py-2 text-sm bg-transparent text-gray-700 focus:border-teal-600 transition"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    className="w-full py-3.5 bg-gradient-to-br from-teal-600 to-teal-700 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition cursor-pointer"
                >
                    Sign Up
                </button>

                <p className="text-center mt-5 text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-teal-600 font-semibold no-underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;