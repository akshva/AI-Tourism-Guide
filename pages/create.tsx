import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { FiMapPin, FiCalendar, FiDollarSign, FiHeart } from 'react-icons/fi';

const INTERESTS_OPTIONS = [
  'Sightseeing',
  'Adventure',
  'Food & Dining',
  'Culture & History',
  'Beaches',
  'Mountains',
  'Nightlife',
  'Shopping',
  'Wildlife',
  'Museums',
  'Nature',
  'Photography',
];

export default function Create() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    days: '',
    budget: '',
    interests: [] as string[],
  });

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.destination || !formData.days || !formData.budget) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/itineraries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.message || 'Failed to generate itinerary';
        console.error('API Error:', errorMessage);
        console.error('Full response:', data);
        throw new Error(errorMessage);
      }

      if (!data.success || !data.data) {
        throw new Error('Invalid response from server');
      }

      toast.success('Itinerary generated successfully!');
      router.push(`/itineraries/${data.data._id}`);
    } catch (error: any) {
      console.error('Error generating itinerary:', error);
      let errorMessage = error.message || 'Failed to generate itinerary. Please check your API keys and try again.';
      
      // Show multi-line errors in a more readable way
      if (errorMessage.includes('\n')) {
        const lines = errorMessage.split('\n');
        toast.error(lines[0], { duration: 6000 });
        // Log full error for debugging
        console.error('Full error details:', errorMessage);
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Itinerary</h1>
              <p className="text-gray-600 mb-8">Tell us about your trip and we'll create a detailed plan</p>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label htmlFor="destination" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <FiMapPin className="w-5 h-5 mr-2 text-blue-600" />
                    Destination *
                  </label>
                  <input
                    type="text"
                    id="destination"
                    required
                    placeholder="e.g., Paris, France"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="days" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FiCalendar className="w-5 h-5 mr-2 text-purple-600" />
                      Number of Days *
                    </label>
                    <input
                      type="number"
                      id="days"
                      required
                      min="1"
                      max="30"
                      placeholder="e.g., 5"
                      value={formData.days}
                      onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="budget" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FiDollarSign className="w-5 h-5 mr-2 text-green-600" />
                      Budget *
                    </label>
                    <input
                      type="text"
                      id="budget"
                      required
                      placeholder="e.g., ₹50,000"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                    <FiHeart className="w-5 h-5 mr-2 text-red-600" />
                    Interests (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {INTERESTS_OPTIONS.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleInterestToggle(interest)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          formData.interests.includes(interest)
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                            : 'border-gray-300 hover:border-blue-400 text-gray-700'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating Itinerary...' : 'Generate Itinerary ✈️'}
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

