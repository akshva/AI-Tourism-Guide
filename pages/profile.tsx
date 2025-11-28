import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { FiUser, FiMail, FiSave } from 'react-icons/fi';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function Profile() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();

      if (res.ok) {
        setProfile(data.data);
        setFormData({
          name: data.data.name || '',
          image: data.data.image || '',
        });
      } else {
        toast.error(data.message || 'Failed to fetch profile');
      }
    } catch (error: any) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Profile updated successfully!');
        setProfile(data.data);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center space-x-6 mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Profile Picture</p>
                    <p className="text-xs text-gray-400 mt-1">Avatar based on your name</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <FiUser className="w-5 h-5 mr-2 text-blue-600" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <FiMail className="w-5 h-5 mr-2 text-blue-600" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    disabled
                    value={profile?.email || ''}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="image" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    Profile Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/your-image.jpg"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>

                {profile && (
                  <div className="border-t pt-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Member Since</p>
                        <p className="text-gray-900 font-medium">
                          {profile.createdAt && new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Updated</p>
                        <p className="text-gray-900 font-medium">
                          {profile.updatedAt && new Date(profile.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSave className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

