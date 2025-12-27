import React, { useState } from 'react';
import { User, Mail, Lock, CheckCircle } from 'lucide-react';
import api from '../api';

const Register = ({ onBack, onLoginClick }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'ADMIN'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            setIsLoading(true);
            await api.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });
            setIsSuccess(true);
        } catch (err) {
            alert("Registration failed: " + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-2xl shadow-xl text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-500 w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
                <p className="text-gray-600 mb-8">
                    You can now log in to the mobile app using your credentials to start uploading photos.
                </p>
                <button
                    onClick={onBack}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
                >
                    Back to Gallery
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-8 p-8 bg-white rounded-2xl shadow-xl">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-2 text-center">Admin Registration</h2>
            <p className="text-gray-500 text-center mb-8">Create an administrator account to manage events.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <User className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                </div>

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
                        minLength={6}
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all text-lg mt-4"
                >
                    {isLoading ? 'Creating Account...' : 'Sign Up as Admin'}
                </button>

                <div className="text-center mt-6">
                    <p className="text-gray-500">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={onLoginClick}
                            className="text-primary font-bold hover:underline"
                        >
                            Login
                        </button>
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onBack}
                    className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                >
                    Cancel
                </button>
            </form>
        </div>
    );
};

export default Register;
