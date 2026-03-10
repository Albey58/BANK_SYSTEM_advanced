import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0F0F10] to-black">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]" />
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]" />
        </div>

        <Card className="w-full max-w-md space-y-8 relative z-10 glass-card border-white/10 shadow-2xl shadow-black/50">
            <div className="text-center space-y-2">
                <div className="inline-flex p-4 rounded-full bg-surface/50 border border-white/10 mb-4 shadow-inner">
                    <ShieldCheck className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
                <p className="text-secondary">Enter your credentials to access your secure account</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Input 
                            label="Email" 
                            type="email" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="name@example.com"
                            required
                            className="bg-black/20 border-white/10 focus:border-accent/50 focus:ring-accent/20"
                        />
                    </div>
                    <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-secondary">Password</label>
                            <a href="#" className="text-sm text-accent hover:text-accent/80 transition-colors">Forgot password?</a>
                        </div>
                        <Input 
                            type="password" 
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                            className="bg-black/20 border-white/10 focus:border-accent/50 focus:ring-accent/20"
                        />
                    </div>
                </div>
                
                {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-red-300 text-sm font-medium">{error}</span>
                    </div>
                )}
                
                <Button type="submit" className="w-full py-6 text-lg font-semibold bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20" isLoading={loading}>
                    Sign in to Account
                </Button>

                <div className="text-center text-sm text-secondary">
                    Don't have an account? <a href="#" className="text-white hover:underline">Contact Support</a>
                </div>
            </form>
        </Card>
    </div>
  );
};

export default Login;
