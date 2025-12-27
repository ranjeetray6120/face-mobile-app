import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import api from '../api';

const Login = ({ onBack, onRegisterClick }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const { data } = await api.post('/auth/login', formData);
            // In a real app, we'd store the token and redirect to an admin dashboard
            localStorage.setItem('authToken', data.token);
            alert("Login successful! Token saved (demo only).");
            onBack(); // Go back to gallery or landing
        } catch (err) {
            alert("Login failed: " + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-8 bg-white rounded-2xl shadow-xl">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-2 text-center">Admin Login</h2>
            <p className="text-gray-500 text-center mb-8">Access your administrator dashboard.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all text-lg mt-4 flex items-center justify-center gap-2"
                >
                    {isLoading ? 'Logging in...' : <><LogIn size={20} /> Login</>}
                </button>

                <div className="text-center mt-6">
                    <p className="text-gray-500">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={onRegisterClick}
                            className="text-primary font-bold hover:underline"
                        >
                            Sign Up
                        </button>
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onBack}
                    className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                >
                    Back to Gallery
                </button>
            </form>
        </div>
    );
};

export default Login;
