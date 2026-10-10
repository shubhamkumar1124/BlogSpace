import { useState } from 'react';
import { useAppContext } from '../context/UseAppContext';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const { axios, setUser } = useAppContext();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/api/blog/login', { email, password });
            if (data.success) {
                setUser(data.user);
                toast.success("Login successful!");
                navigate('/');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message || "Something went wrong!");
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
                    <span className="text-teal-600">Admin</span> Login
                </h2>
                <p className="text-center text-gray-400 text-sm mb-8">
                    Enter your credentials to access the admin panel
                </p>

                <div className="mb-6">
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Email</label>
                    <input
                        type="email"
                        placeholder="admin@example.com"
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
                        placeholder="••••••••••"
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
                    Login
                </button>

                <p className="text-center mt-5 text-sm text-gray-500">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-teal-600 font-semibold no-underline">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;