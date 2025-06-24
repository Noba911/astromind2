import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";
import { useForm } from "react-hook-form";
import { 
  Stars, 
  Heart, 
  Users, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Mail, 
  Lock,
  Moon,
  Sun,
  Sparkles,
  LogOut,
  Menu,
  X,
  Settings,
  Edit3,
  Save,
  ArrowLeft
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [selectedTone, setSelectedTone] = useState(localStorage.getItem('selectedTone') || 'serious');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/profile`);
      setUser(response.data);
    } catch (error) {
      console.error('Profile fetch error:', error);
      logout();
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${API}/profile`, profileData);
      setUser(response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedTone');
    setToken(null);
    setUser(null);
    setSelectedTone('serious');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateTone = (tone) => {
    setSelectedTone(tone);
    localStorage.setItem('selectedTone', tone);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateProfile, 
      selectedTone, 
      updateTone, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    <span className="text-purple-600 font-medium">Loading...</span>
  </div>
);

// Welcome Screen
const WelcomeScreen = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative">
          <Stars className="h-20 w-20 mx-auto text-yellow-400 animate-pulse" />
          <Sparkles className="h-8 w-8 absolute -top-2 -right-2 text-pink-400 animate-bounce" />
        </div>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
          AstroAI
        </h1>
        
        <p className="text-xl text-gray-200 leading-relaxed">
          Discover your cosmic destiny with AI-powered astrology insights
        </p>
        
        <div className="space-y-3 pt-4">
          <div className="flex items-center space-x-3 text-gray-300">
            <Moon className="h-5 w-5 text-blue-400" />
            <span>Personalized daily horoscopes</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <Heart className="h-5 w-5 text-red-400" />
            <span>Relationship compatibility analysis</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <Users className="h-5 w-5 text-green-400" />
            <span>Friend communication guidance</span>
          </div>
        </div>
        
        <div className="space-y-3 pt-6">
          <button 
            onClick={() => onNavigate('login')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            Sign In
          </button>
          <button 
            onClick={() => onNavigate('register')}
            className="w-full border-2 border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

// Register Form
const RegisterForm = ({ onNavigate }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API}/auth/register`, data);
      login(response.data.access_token, response.data.user);
    } catch (error) {
      setError(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-6">
          <Stars className="h-12 w-12 mx-auto text-yellow-400 mb-2" />
          <h2 className="text-2xl font-bold text-white">Join AstroAI</h2>
          <p className="text-gray-300">Enter your cosmic details</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                {...register("name", { required: "Name is required" })}
                type="text"
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
                type="email"
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                {...register("password", { required: "Password is required", minLength: { value: 6, message: "Password must be at least 6 characters" } })}
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                {...register("birth_date", { required: "Birth date is required" })}
                type="date"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {errors.birth_date && <p className="text-red-400 text-sm mt-1">{errors.birth_date.message}</p>}
          </div>

          <div>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                {...register("birth_time", { required: "Birth time is required" })}
                type="time"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {errors.birth_time && <p className="text-red-400 text-sm mt-1">{errors.birth_time.message}</p>}
          </div>

          <div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                {...register("birth_place", { required: "Birth place is required" })}
                type="text"
                placeholder="Birth Place (City, Country)"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {errors.birth_place && <p className="text-red-400 text-sm mt-1">{errors.birth_place.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
          >
            {isLoading ? <LoadingSpinner /> : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            onClick={() => onNavigate('login')}
            className="text-purple-300 hover:text-purple-200 transition-colors"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

// Login Form
const LoginForm = ({ onNavigate }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API}/auth/login`, data);
      login(response.data.access_token, response.data.user);
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-6">
          <Stars className="h-12 w-12 mx-auto text-yellow-400 mb-2" />
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-gray-300">Sign in to your cosmic journey</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                {...register("email", { required: "Email is required" })}
                type="email"
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                {...register("password", { required: "Password is required" })}
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
          >
            {isLoading ? <LoadingSpinner /> : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            onClick={() => onNavigate('register')}
            className="text-purple-300 hover:text-purple-200 transition-colors"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

// Settings Screen
const SettingsScreen = ({ onBack }) => {
  const { user, logout, updateProfile, selectedTone, updateTone } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: user?.name || '',
      birth_date: user?.birth_date || '',
      birth_time: user?.birth_time || '',
      birth_place: user?.birth_place || ''
    }
  });

  const tones = [
    { id: 'serious', name: 'Serious', icon: '🧘‍♀️', color: 'blue', desc: 'Thoughtful and professional insights' },
    { id: 'humorous', name: 'Humorous', icon: '😄', color: 'yellow', desc: 'Witty and playful guidance' },
    { id: 'soul', name: 'Soul', icon: '✨', color: 'purple', desc: 'Spiritual and mystical wisdom' }
  ];

  const handleToneChange = (tone) => {
    updateTone(tone);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Only send fields that have changed
      const updateData = {};
      if (data.name !== user.name) updateData.name = data.name;
      if (data.birth_date !== user.birth_date) updateData.birth_date = data.birth_date;
      if (data.birth_time !== user.birth_time) updateData.birth_time = data.birth_time;
      if (data.birth_place !== user.birth_place) updateData.birth_place = data.birth_place;

      if (Object.keys(updateData).length > 0) {
        await updateProfile(updateData);
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to original values
      reset({
        name: user?.name || '',
        birth_date: user?.birth_date || '',
        birth_time: user?.birth_time || '',
        birth_place: user?.birth_place || ''
      });
    }
    setIsEditing(!isEditing);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
            <span>Back</span>
          </button>
          <div className="flex items-center space-x-2">
            <Settings className="h-6 w-6 text-purple-400" />
            <h1 className="text-xl font-bold text-white">Settings</h1>
          </div>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* AI Tone Settings */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span>AI Personality</span>
          </h3>
          
          <div className="space-y-3">
            {tones.map((tone) => (
              <div
                key={tone.id}
                onClick={() => handleToneChange(tone.id)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedTone === tone.id
                    ? 'bg-white/20 border-2 border-purple-400'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{tone.icon}</div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{tone.name}</div>
                    <div className="text-gray-300 text-sm">{tone.desc}</div>
                  </div>
                  {selectedTone === tone.id && (
                    <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Settings */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-400" />
              <span>Personal Information</span>
            </h3>
            <button
              onClick={handleEditToggle}
              className="flex items-center space-x-1 text-purple-300 hover:text-purple-200 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                {...register("name", { required: "Name is required" })}
                type="text"
                disabled={!isEditing}
                className={`w-full py-3 px-4 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isEditing 
                    ? 'bg-white/10 border border-white/20' 
                    : 'bg-white/5 border border-white/10 cursor-default'
                }`}
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Birth Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  {...register("birth_date", { required: "Birth date is required" })}
                  type="date"
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isEditing 
                      ? 'bg-white/10 border border-white/20' 
                      : 'bg-white/5 border border-white/10 cursor-default'
                  }`}
                />
              </div>
              {errors.birth_date && <p className="text-red-400 text-sm mt-1">{errors.birth_date.message}</p>}
            </div>

            {/* Birth Time */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Birth Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  {...register("birth_time", { required: "Birth time is required" })}
                  type="time"
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isEditing 
                      ? 'bg-white/10 border border-white/20' 
                      : 'bg-white/5 border border-white/10 cursor-default'
                  }`}
                />
              </div>
              {errors.birth_time && <p className="text-red-400 text-sm mt-1">{errors.birth_time.message}</p>}
            </div>

            {/* Birth Place */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Birth Place
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  {...register("birth_place", { required: "Birth place is required" })}
                  type="text"
                  disabled={!isEditing}
                  placeholder="City, Country"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isEditing 
                      ? 'bg-white/10 border border-white/20' 
                      : 'bg-white/5 border border-white/10 cursor-default'
                  }`}
                />
              </div>
              {errors.birth_place && <p className="text-red-400 text-sm mt-1">{errors.birth_place.message}</p>}
            </div>

            {/* Current Zodiac Sign */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Zodiac Sign
              </label>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Stars className="h-5 w-5 text-yellow-400" />
                  <span className="text-white font-medium">{user?.zodiac_sign}</span>
                </div>
              </div>
            </div>

            {isEditing && (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            )}
          </form>
        </div>

        {/* Account Actions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-white font-semibold mb-4">Account</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-300 text-sm">Email</div>
                <div className="text-white">{user?.email}</div>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-3">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard
const Dashboard = () => {
  const { user, logout, selectedTone } = useAuth();
  const [activeTab, setActiveTab] = useState('horoscope');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [horoscope, setHoroscope] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [friendAdvice, setFriendAdvice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const getDailyHoroscope = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/horoscope/daily`, { tone: selectedTone });
      setHoroscope(response.data);
    } catch (error) {
      console.error('Horoscope error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeCompatibility = async (data) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/compatibility/analyze`, {
        ...data,
        tone: selectedTone
      });
      setCompatibility(response.data);
    } catch (error) {
      console.error('Compatibility error:', error);
    } finally {
      setIsLoading(false);
      reset();
    }
  };

  const getFriendAdvice = async (data) => {
    setIsLoading(true);
    try {
      const friendNames = data.friend_names.split(',').map(name => name.trim()).filter(name => name);
      const response = await axios.post(`${API}/friends/advice`, {
        friend_names: friendNames,
        tone: selectedTone
      });
      setFriendAdvice(response.data);
    } catch (error) {
      console.error('Friend advice error:', error);
    } finally {
      setIsLoading(false);
      reset();
    }
  };

  const tabs = [
    { id: 'horoscope', name: 'Daily Horoscope', icon: Sun },
    { id: 'compatibility', name: 'Compatibility', icon: Heart },
    { id: 'friends', name: 'Friend Advice', icon: Users }
  ];

  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Stars className="h-8 w-8 text-yellow-400" />
            <div>
              <h1 className="text-xl font-bold text-white">AstroAI</h1>
              <p className="text-sm text-gray-300">{user?.zodiac_sign}</p>
            </div>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white p-2 hover:bg-white/10 rounded-lg"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="bg-white/5 backdrop-blur-lg border-t border-white/10 px-4 py-4">
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-gray-300 text-sm">{user?.email}</p>
              </div>
              
              <div className="border-t border-white/10 pt-3 space-y-2">
                <button
                  onClick={() => {
                    setShowSettings(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2 text-red-300 hover:text-red-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current AI Tone Display */}
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-3 border border-white/10 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-gray-300 text-sm">
              AI Tone: <span className="text-white font-medium capitalize">{selectedTone}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-1 border border-white/20">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">{tab.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        {activeTab === 'horoscope' && (
          <div className="space-y-4">
            <button
              onClick={getDailyHoroscope}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            >
              {isLoading ? <LoadingSpinner /> : 'Get Daily Horoscope'}
            </button>

            {horoscope && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-2 mb-4">
                  <Sun className="h-6 w-6 text-yellow-400" />
                  <h3 className="text-white font-semibold">Today's Horoscope</h3>
                </div>
                <p className="text-gray-200 leading-relaxed">{horoscope.content}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <span className="text-gray-400 text-sm">Tone: {horoscope.tone}</span>
                  <span className="text-gray-400 text-sm">{new Date(horoscope.generated_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'compatibility' && (
          <div className="space-y-4">
            <form onSubmit={handleSubmit(analyzeCompatibility)} className="space-y-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <h3 className="text-white font-medium mb-4">Partner's Birth Details</h3>
                
                <div className="space-y-3">
                  <input
                    {...register("partner_birth_date", { required: true })}
                    type="date"
                    className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  
                  <input
                    {...register("partner_birth_time", { required: true })}
                    type="time"
                    className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  
                  <input
                    {...register("partner_birth_place", { required: true })}
                    type="text"
                    placeholder="Birth Place (City, Country)"
                    className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
              >
                {isLoading ? <LoadingSpinner /> : 'Analyze Compatibility'}
              </button>
            </form>

            {compatibility && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-2 mb-4">
                  <Heart className="h-6 w-6 text-red-400" />
                  <h3 className="text-white font-semibold">Compatibility Analysis</h3>
                </div>
                <p className="text-gray-200 leading-relaxed">{compatibility.content}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <span className="text-gray-400 text-sm">Tone: {compatibility.tone}</span>
                  <span className="text-gray-400 text-sm">{new Date(compatibility.generated_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="space-y-4">
            <form onSubmit={handleSubmit(getFriendAdvice)} className="space-y-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <h3 className="text-white font-medium mb-4">Friend Communication</h3>
                
                <textarea
                  {...register("friend_names", { required: true })}
                  placeholder="Enter friend names separated by commas"
                  rows="3"
                  className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
              >
                {isLoading ? <LoadingSpinner /> : 'Get Friend Advice'}
              </button>
            </form>

            {friendAdvice && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="h-6 w-6 text-green-400" />
                  <h3 className="text-white font-semibold">Communication Advice</h3>
                </div>
                <p className="text-gray-200 leading-relaxed">{friendAdvice.content}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <span className="text-gray-400 text-sm">Tone: {friendAdvice.tone}</span>
                  <span className="text-gray-400 text-sm">{new Date(friendAdvice.generated_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <div className="App">
      {currentScreen === 'welcome' && <WelcomeScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'login' && <LoginForm onNavigate={setCurrentScreen} />}
      {currentScreen === 'register' && <RegisterForm onNavigate={setCurrentScreen} />}
    </div>
  );
}

// App with Auth Provider
function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithAuth;