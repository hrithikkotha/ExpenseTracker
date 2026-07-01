import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon,
  Sun,
  LogOut,
  User,
  Bell,
  Download,
  HelpCircle,
  Shield,
  ChevronRight,
  DollarSign as CurrencyIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CURRENCIES, getCurrencySymbol } from '../lib/currencies';

export default function SettingsPage() {
  const { user, logout, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      setIsLoggingOut(true);
      try {
        await logout();
        navigate('/login', { replace: true });
      } catch (error) {
        console.error('Logout failed:', error);
        setIsLoggingOut(false);
      }
    }
  };

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile',
          description: user?.email || 'Not logged in',
          onClick: () => navigate('/profile'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: theme === 'dark' ? Moon : Sun,
          label: 'Theme',
          description: theme === 'dark' ? 'Dark mode' : 'Light mode',
          onClick: toggleTheme,
          showToggle: true,
        },
        {
          icon: CurrencyIcon,
          label: 'Currency',
          description: `${user?.currency || 'INR'} (${getCurrencySymbol(user?.currency || 'INR')})`,
          onClick: () => setShowCurrencyPicker(true),
        },
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Manage notification preferences',
          onClick: () => alert('Coming soon!'),
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          icon: Download,
          label: 'Export Data',
          description: 'Download your transaction history',
          onClick: () => navigate('/export'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & FAQ',
          description: 'Get help and support',
          onClick: () => alert('Help coming soon!'),
        },
        {
          icon: Shield,
          label: 'Privacy Policy',
          description: 'View our privacy policy',
          onClick: () => alert('Privacy policy coming soon!'),
        },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* User Card */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{user?.name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.currency && (
                <p className="text-xs text-muted-foreground mt-1">
                  Currency: {user.currency}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        {settingSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-2">
              {section.title}
            </h3>
            <div className="bg-card border rounded-xl overflow-hidden">
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                      idx !== section.items.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    {item.showToggle ? (
                      <div
                        className={`w-12 h-6 rounded-full transition-colors ${
                          theme === 'dark' ? 'bg-primary' : 'bg-muted'
                        } relative`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 bg-background rounded-full shadow-sm transition-transform ${
                            theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <>
              <div className="w-5 h-5 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
              <span className="font-semibold text-destructive">Logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5 text-destructive" />
              <span className="font-semibold text-destructive">Log Out</span>
            </>
          )}
        </button>

        {/* App Info */}
        <div className="text-center pt-4 pb-8">
          <p className="text-sm text-muted-foreground">
            Expense Tracker v1.0.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Made with ❤️ for better financial tracking
          </p>
        </div>
      </div>

      {/* Currency Picker Modal */}
      {showCurrencyPicker && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCurrencyPicker(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4 bg-background border border-border rounded-xl shadow-2xl max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Select Currency</h3>
              <p className="text-sm text-muted-foreground mt-1">Choose your preferred currency</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {CURRENCIES.map((currency) => (
                <button
                  key={currency.code}
                  onClick={async () => {
                    try {
                      // Update user currency
                      const response = await fetch('/api/v1/users/me', {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                        },
                        body: JSON.stringify({ currency: currency.code }),
                      });
                      if (response.ok) {
                        const data = await response.json();
                        setUser(data.data);
                        setShowCurrencyPicker(false);
                      }
                    } catch (error) {
                      console.error('Failed to update currency:', error);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors ${
                    user?.currency === currency.code ? 'bg-primary/10 border border-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{currency.symbol}</span>
                    <div className="text-left">
                      <p className="font-medium text-sm text-foreground">{currency.code}</p>
                      <p className="text-xs text-muted-foreground">{currency.name}</p>
                    </div>
                  </div>
                  {user?.currency === currency.code && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
