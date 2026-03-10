import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Rocket, ChevronLeft } from 'lucide-react';
import api from '../api/axios';

const Login = () => {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [formData, setFormData] = useState({
        email: '', password: '', 
        full_name: '', tax_id: '', initial_pin: '', branch_id: ''
    });
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (mode === 'register') {
            fetchBranches();
        }
    }, [mode]);

    const fetchBranches = async () => {
        try {
            const res = await api.get('/branches');
            if (res.data.success) {
                setBranches(res.data.branches);
                if (res.data.branches.length > 0) {
                    setFormData(prev => ({ ...prev, branch_id: res.data.branches[0].branch_id }));
                }
            }
        } catch (err) {
            console.error("Failed to fetch branches", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const result = await login(formData.email, formData.password);
                if (result.success) {
                    navigate('/');
                } else {
                    setError(result.error);
                }
            } else {
                // Perform registration
                const res = await api.post('/auth/register', formData);
                if (res.data.success) {
                    // Auto-login after registration
                    const loginRes = await login(formData.email, formData.password);
                    if (loginRes.success) navigate('/');
                } else {
                    setError(res.data.error || "Registration failed");
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0F0F10] to-black">
            {/* Abstract Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]" />
            </div>

            <Card className={`w-full ${mode === 'register' ? 'max-w-xl' : 'max-w-md'} space-y-8 relative z-10 glass-card border-white/10 shadow-2xl shadow-black/50 transition-all duration-300`}>
                <div className="text-center space-y-2">
                    <div className="inline-flex p-4 rounded-full bg-surface/50 border border-white/10 mb-4 shadow-inner">
                        {mode === 'login' ? <ShieldCheck className="w-8 h-8 text-accent" /> : <Rocket className="w-8 h-8 text-accent" />}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        {mode === 'login' ? 'Welcome back' : 'Ignite your Account'}
                    </h1>
                    <p className="text-secondary">
                        {mode === 'login' ? 'Enter your credentials to access your secure account' : 'Start your journey across the financial galaxy'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mode === 'register' && (
                            <div className="md:col-span-2">
                                <Input
                                    label="Full Name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Commander Data"
                                    required
                                />
                            </div>
                        )}
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="name@example.com"
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                            required
                        />
                        {mode === 'register' && (
                            <>
                                <Input
                                    label="Tax ID / SSN"
                                    value={formData.tax_id}
                                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                    placeholder="XXX-XX-XXXX"
                                    required
                                />
                                <Input
                                    label="Transaction PIN (4-6 digits)"
                                    type="password"
                                    value={formData.initial_pin}
                                    onChange={(e) => setFormData({ ...formData, initial_pin: e.target.value })}
                                    placeholder="••••"
                                    required
                                    maxLength={6}
                                />
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-secondary">Assigned Galactic Sector (Branch)</label>
                                    <select 
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                                        value={formData.branch_id}
                                        onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled className="bg-surface">Select a Sector</option>
                                        {branches.map(b => (
                                            <option key={b.branch_id} value={b.branch_id} className="bg-surface">
                                                {b.branch_name} ({b.location})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            <span className="text-red-300 text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <Button type="submit" className="w-full py-6 text-lg font-semibold bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20" isLoading={loading}>
                        {mode === 'login' ? 'Sign in to Account' : 'Initialize Account'}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#0F0F10] px-2 text-secondary">Or</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="w-full py-3 rounded-lg border border-white/5 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-secondary hover:text-white"
                    >
                        {mode === 'login' ? (
                            <>Initialize New Account <Rocket className="w-4 h-4" /></>
                        ) : (
                            <>Back to Login <ChevronLeft className="w-4 h-4" /></>
                        )}
                    </button>
                    
                    {mode === 'login' && (
                         <div className="text-center">
                             <a href="#" className="text-xs text-secondary hover:text-white transition-colors">Forgot your access code?</a>
                         </div>
                    )}
                </form>
            </Card>
        </div>
    );
};

export default Login;
