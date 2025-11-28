import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AudioGuide from '@/components/AudioGuide';
import { IItinerary, IDay, IActivity } from '@/models/Itinerary';
import { useSession } from 'next-auth/react';
import {
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiUsers,
  FiUserPlus,
  FiTrash2,
  FiStar,
  FiCheckCircle,
  FiDownload,
  FiActivity,
  FiGlobe,
  FiMessageCircle,
  FiSun,
} from 'react-icons/fi';
import { format } from 'date-fns';
import Link from 'next/link';
import { downloadItineraryPDF } from '@/lib/pdfGenerator';
import { formatCostToINR } from '@/lib/currencyUtils';

export default function ItineraryDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [itinerary, setItinerary] = useState<IItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [addingCollaborator, setAddingCollaborator] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchItinerary();
    }
  }, [id]);

  const fetchItinerary = async () => {
    try {
      const res = await fetch(`/api/itineraries/${id}`);
      const data = await res.json();

      if (res.ok) {
        setItinerary(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch itinerary');
        router.push('/');
      }
    } catch (error: any) {
      toast.error('Failed to fetch itinerary');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!collaboratorEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setAddingCollaborator(true);

    try {
      const res = await fetch(`/api/itineraries/${id}/collaborate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: collaboratorEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Collaborator added successfully!');
        setItinerary(data.data);
        setCollaboratorEmail('');
      } else {
        toast.error(data.message || 'Failed to add collaborator');
      }
    } catch (error: any) {
      toast.error('Failed to add collaborator');
    } finally {
      setAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }

    try {
      const res = await fetch(`/api/itineraries/${id}/collaborate`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collaboratorId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Collaborator removed successfully!');
        setItinerary(data.data);
      } else {
        toast.error(data.message || 'Failed to remove collaborator');
      }
    } catch (error: any) {
      toast.error('Failed to remove collaborator');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this itinerary? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(`/api/itineraries/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Itinerary deleted successfully!');
        router.push('/');
      } else {
        toast.error(data.message || 'Failed to delete itinerary');
      }
    } catch (error: any) {
      toast.error('Failed to delete itinerary');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!itinerary) return;

    setDownloading(true);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      downloadItineraryPDF(itinerary);
      toast.success('PDF downloaded successfully!');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const isOwner = itinerary && session?.user?.id === itinerary.userId?.toString();
  const isCollaborator = itinerary && itinerary.collaborators?.some(
    (collab) => collab.toString() === session?.user?.id || (typeof collab === 'object' && collab._id?.toString() === session?.user?.id)
  );

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

  if (!itinerary) {
    return null;
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Audio Guide */}
            {itinerary && <AudioGuide itinerary={itinerary} />}

            {/* Header */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{itinerary.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-gray-600">
                    <div className="flex items-center">
                      <FiMapPin className="w-5 h-5 mr-2 text-blue-600" />
                      <span>{itinerary.destination}</span>
                    </div>
                    <div className="flex items-center">
                      <FiCalendar className="w-5 h-5 mr-2 text-purple-600" />
                      <span>{itinerary.totalDays} day{itinerary.totalDays > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center">
                      <FiDollarSign className="w-5 h-5 mr-2 text-green-600" />
                      <span>Budget: {formatCostToINR(itinerary.budget)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {downloading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FiDownload className="w-5 h-5" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>
                  {isOwner && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {itinerary.summary && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Summary</h3>
                  <div className="flex flex-col lg:flex-row gap-6">
                    {itinerary.summary.highlights && itinerary.summary.highlights.length > 0 && (
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 mb-2">Highlights</p>
                        <ul className="space-y-1">
                          {itinerary.summary.highlights.map((highlight, index) => (
                            <li key={index} className="flex items-center text-gray-600">
                              <FiStar className="w-4 h-4 mr-2 text-yellow-500" />
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Trip Statistics & Destination Info Card */}
                    <div className="flex-1">
                      <TripStatsCard itinerary={itinerary} />
                    </div>
                  </div>
                </div>
              )}

              {/* Collaboration Section */}
              {(isOwner || isCollaborator) && (
                <div className="border-t pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FiUsers className="w-5 h-5 mr-2" />
                      Collaborators
                    </h3>
                  </div>

                  {itinerary.collaborators && itinerary.collaborators.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {itinerary.collaborators.map((collab, index) => {
                        const collabData = typeof collab === 'object' && 'name' in collab ? collab : null;
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-gray-700">{(collabData as any)?.name || (collabData as any)?.email || 'Collaborator'}</span>
                            {isOwner && (
                              <button
                                onClick={() => handleRemoveCollaborator(
                                  typeof collab === 'object' && collab._id ? collab._id.toString() : collab.toString()
                                )}
                                className="text-red-600 hover:text-red-700"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isOwner && (
                    <form onSubmit={handleAddCollaborator} className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter collaborator email"
                        value={collaboratorEmail}
                        onChange={(e) => setCollaboratorEmail(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={addingCollaborator}
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiUserPlus className="w-5 h-5" />
                        <span>{addingCollaborator ? 'Adding...' : 'Add'}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Itinerary Days Grid */}
            {itinerary.days && itinerary.days.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {itinerary.days.map((day: IDay, dayIndex: number) => (
                  <DayCard key={dayIndex} day={day} dayNumber={dayIndex + 1} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <p className="text-gray-600 text-lg">No itinerary details available yet.</p>
              </div>
            )}

            {/* Tips Section - Moved to end after itinerary */}
            {itinerary.summary && itinerary.summary.tips && itinerary.summary.tips.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Tips</h3>
                <ul className="space-y-3">
                  {itinerary.summary.tips.map((tip, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <FiCheckCircle className="w-5 h-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

function DayCard({ day, dayNumber }: { day: IDay; dayNumber: number }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-900">Day {dayNumber}</h2>
        {day.totalCost && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            {formatCostToINR(day.totalCost)}
          </span>
        )}
      </div>

      {day.activities && day.activities.length > 0 ? (
        <div className="space-y-4">
          {day.activities.map((activity: IActivity, index: number) => (
            <ActivityCard key={index} activity={activity} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No activities planned for this day.</p>
      )}

      {day.notes && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600 italic">{day.notes}</p>
        </div>
      )}
    </div>
  );
}

function ActivityCard({ activity }: { activity: IActivity }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <FiClock className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-600">{activity.time}</span>
        {activity.duration && (
          <span className="text-xs text-gray-500">({activity.duration})</span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{activity.title}</h3>
      {activity.location && (
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <FiMapPin className="w-4 h-4 mr-1" />
          <span>{activity.location}</span>
        </div>
      )}
      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
      <div className="flex items-center justify-between">
        {activity.category && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {activity.category}
          </span>
        )}
        {activity.cost && (
          <span className="text-sm font-semibold text-green-600">{formatCostToINR(activity.cost)}</span>
        )}
      </div>
    </div>
  );
}

function TripStatsCard({ itinerary }: { itinerary: IItinerary }) {
  // Calculate total activities
  const totalActivities = itinerary.days?.reduce((total, day) => {
    return total + (day.activities?.length || 0);
  }, 0) || 0;

  // Calculate budget per day in INR
  const budgetValue = itinerary.budget?.replace(/[^0-9.]/g, '') || '0';
  const budgetPerDay = itinerary.totalDays > 0 
    ? (parseFloat(budgetValue) / itinerary.totalDays).toFixed(0)
    : '0';

  // Destination info mapping with comprehensive data
  const getDestinationInfo = (destination: string) => {
    const destLower = destination.toLowerCase().trim();
    
    // Extract city name (remove country if present)
    const cityName = destLower.split(',')[0].trim();
    
    // Comprehensive currency mapping
    const currencyMap: { [key: string]: string } = {
      // Europe
      'paris': 'EUR (€)', 'france': 'EUR (€)', 'lyon': 'EUR (€)', 'marseille': 'EUR (€)',
      'london': 'GBP (£)', 'uk': 'GBP (£)', 'united kingdom': 'GBP (£)', 'britain': 'GBP (£)',
      'rome': 'EUR (€)', 'italy': 'EUR (€)', 'milan': 'EUR (€)', 'venice': 'EUR (€)',
      'madrid': 'EUR (€)', 'spain': 'EUR (€)', 'barcelona': 'EUR (€)',
      'berlin': 'EUR (€)', 'germany': 'EUR (€)', 'munich': 'EUR (€)',
      'amsterdam': 'EUR (€)', 'netherlands': 'EUR (€)',
      'vienna': 'EUR (€)', 'austria': 'EUR (€)',
      'prague': 'CZK (Kč)', 'czech': 'CZK (Kč)',
      'budapest': 'HUF (Ft)', 'hungary': 'HUF (Ft)',
      'athens': 'EUR (€)', 'greece': 'EUR (€)',
      'lisbon': 'EUR (€)', 'portugal': 'EUR (€)',
      'stockholm': 'SEK (kr)', 'sweden': 'SEK (kr)',
      'oslo': 'NOK (kr)', 'norway': 'NOK (kr)',
      'copenhagen': 'DKK (kr)', 'denmark': 'DKK (kr)',
      'zurich': 'CHF', 'switzerland': 'CHF',
      'brussels': 'EUR (€)', 'belgium': 'EUR (€)',
      
      // Asia
      'tokyo': 'JPY (¥)', 'japan': 'JPY (¥)', 'osaka': 'JPY (¥)', 'kyoto': 'JPY (¥)',
      'beijing': 'CNY (¥)', 'china': 'CNY (¥)', 'shanghai': 'CNY (¥)',
      'mumbai': 'INR (₹)', 'delhi': 'INR (₹)', 'india': 'INR (₹)', 'bangalore': 'INR (₹)', 'kolkata': 'INR (₹)',
      'singapore': 'SGD (S$)',
      'bangkok': 'THB (฿)', 'thailand': 'THB (฿)',
      'kuala lumpur': 'MYR (RM)', 'malaysia': 'MYR (RM)',
      'jakarta': 'IDR (Rp)', 'indonesia': 'IDR (Rp)',
      'manila': 'PHP (₱)', 'philippines': 'PHP (₱)',
      'seoul': 'KRW (₩)', 'south korea': 'KRW (₩)', 'korea': 'KRW (₩)',
      'hanoi': 'VND (₫)', 'vietnam': 'VND (₫)', 'ho chi minh': 'VND (₫)',
      'hong kong': 'HKD (HK$)', 'taipei': 'TWD (NT$)', 'taiwan': 'TWD (NT$)',
      
      // Middle East
      'dubai': 'AED (د.إ)', 'uae': 'AED (د.إ)', 'abu dhabi': 'AED (د.إ)',
      'riyadh': 'SAR (﷼)', 'saudi arabia': 'SAR (﷼)',
      'doha': 'QAR (﷼)', 'qatar': 'QAR (﷼)',
      'tel aviv': 'ILS (₪)', 'israel': 'ILS (₪)',
      'istanbul': 'TRY (₺)', 'turkey': 'TRY (₺)',
      
      // Americas
      'new york': 'USD ($)', 'usa': 'USD ($)', 'united states': 'USD ($)', 'america': 'USD ($)',
      'los angeles': 'USD ($)', 'chicago': 'USD ($)', 'miami': 'USD ($)', 'san francisco': 'USD ($)',
      'toronto': 'CAD (C$)', 'canada': 'CAD (C$)', 'vancouver': 'CAD (C$)',
      'mexico city': 'MXN (MX$)', 'mexico': 'MXN (MX$)',
      'rio de janeiro': 'BRL (R$)', 'brazil': 'BRL (R$)', 'sao paulo': 'BRL (R$)',
      'buenos aires': 'ARS ($)', 'argentina': 'ARS ($)',
      'lima': 'PEN (S/)', 'peru': 'PEN (S/)',
      'bogota': 'COP ($)', 'colombia': 'COP ($)',
      
      // Oceania
      'sydney': 'AUD (A$)', 'australia': 'AUD (A$)', 'melbourne': 'AUD (A$)',
      'auckland': 'NZD (NZ$)', 'new zealand': 'NZD (NZ$)',
      
      // Africa
      'cairo': 'EGP (E£)', 'egypt': 'EGP (E£)',
      'cape town': 'ZAR (R)', 'south africa': 'ZAR (R)',
      'nairobi': 'KES (KSh)', 'kenya': 'KES (KSh)',
      'marrakech': 'MAD (د.م.)', 'morocco': 'MAD (د.م.)',
    };

    // Comprehensive language mapping
    const languageMap: { [key: string]: string } = {
      // Europe
      'paris': 'French', 'france': 'French', 'lyon': 'French', 'marseille': 'French',
      'london': 'English', 'uk': 'English', 'united kingdom': 'English', 'britain': 'English',
      'rome': 'Italian', 'italy': 'Italian', 'milan': 'Italian', 'venice': 'Italian',
      'madrid': 'Spanish', 'spain': 'Spanish', 'barcelona': 'Spanish, Catalan',
      'berlin': 'German', 'germany': 'German', 'munich': 'German',
      'amsterdam': 'Dutch', 'netherlands': 'Dutch',
      'vienna': 'German', 'austria': 'German',
      'prague': 'Czech', 'czech': 'Czech',
      'budapest': 'Hungarian', 'hungary': 'Hungarian',
      'athens': 'Greek', 'greece': 'Greek',
      'lisbon': 'Portuguese', 'portugal': 'Portuguese',
      'stockholm': 'Swedish', 'sweden': 'Swedish',
      'oslo': 'Norwegian', 'norway': 'Norwegian',
      'copenhagen': 'Danish', 'denmark': 'Danish',
      'zurich': 'German, French, Italian', 'switzerland': 'German, French, Italian',
      'brussels': 'French, Dutch', 'belgium': 'French, Dutch',
      
      // Asia
      'tokyo': 'Japanese', 'japan': 'Japanese', 'osaka': 'Japanese', 'kyoto': 'Japanese',
      'beijing': 'Mandarin', 'china': 'Mandarin', 'shanghai': 'Mandarin',
      'mumbai': 'Hindi, English', 'delhi': 'Hindi, English', 'india': 'Hindi, English', 'bangalore': 'English, Kannada', 'kolkata': 'Bengali, English',
      'singapore': 'English, Mandarin, Malay',
      'bangkok': 'Thai', 'thailand': 'Thai',
      'kuala lumpur': 'Malay, English', 'malaysia': 'Malay, English',
      'jakarta': 'Indonesian', 'indonesia': 'Indonesian',
      'manila': 'Filipino, English', 'philippines': 'Filipino, English',
      'seoul': 'Korean', 'south korea': 'Korean', 'korea': 'Korean',
      'hanoi': 'Vietnamese', 'vietnam': 'Vietnamese', 'ho chi minh': 'Vietnamese',
      'hong kong': 'Cantonese, English', 'taipei': 'Mandarin', 'taiwan': 'Mandarin',
      
      // Middle East
      'dubai': 'Arabic, English', 'uae': 'Arabic, English', 'abu dhabi': 'Arabic, English',
      'riyadh': 'Arabic', 'saudi arabia': 'Arabic',
      'doha': 'Arabic, English', 'qatar': 'Arabic, English',
      'tel aviv': 'Hebrew, English', 'israel': 'Hebrew, English',
      'istanbul': 'Turkish', 'turkey': 'Turkish',
      
      // Americas
      'new york': 'English', 'usa': 'English', 'united states': 'English', 'america': 'English',
      'los angeles': 'English, Spanish', 'chicago': 'English', 'miami': 'English, Spanish', 'san francisco': 'English',
      'toronto': 'English, French', 'canada': 'English, French', 'vancouver': 'English',
      'mexico city': 'Spanish', 'mexico': 'Spanish',
      'rio de janeiro': 'Portuguese', 'brazil': 'Portuguese', 'sao paulo': 'Portuguese',
      'buenos aires': 'Spanish', 'argentina': 'Spanish',
      'lima': 'Spanish', 'peru': 'Spanish',
      'bogota': 'Spanish', 'colombia': 'Spanish',
      
      // Oceania
      'sydney': 'English', 'australia': 'English', 'melbourne': 'English',
      'auckland': 'English, Maori', 'new zealand': 'English, Maori',
      
      // Africa
      'cairo': 'Arabic', 'egypt': 'Arabic',
      'cape town': 'English, Afrikaans', 'south africa': 'English, Afrikaans',
      'nairobi': 'English, Swahili', 'kenya': 'English, Swahili',
      'marrakech': 'Arabic, French', 'morocco': 'Arabic, French',
    };

    // Comprehensive timezone mapping
    const timezoneMap: { [key: string]: string } = {
      // Europe
      'paris': 'CET (UTC+1)', 'france': 'CET (UTC+1)', 'lyon': 'CET (UTC+1)', 'marseille': 'CET (UTC+1)',
      'london': 'GMT (UTC+0)', 'uk': 'GMT (UTC+0)', 'united kingdom': 'GMT (UTC+0)', 'britain': 'GMT (UTC+0)',
      'rome': 'CET (UTC+1)', 'italy': 'CET (UTC+1)', 'milan': 'CET (UTC+1)', 'venice': 'CET (UTC+1)',
      'madrid': 'CET (UTC+1)', 'spain': 'CET (UTC+1)', 'barcelona': 'CET (UTC+1)',
      'berlin': 'CET (UTC+1)', 'germany': 'CET (UTC+1)', 'munich': 'CET (UTC+1)',
      'amsterdam': 'CET (UTC+1)', 'netherlands': 'CET (UTC+1)',
      'vienna': 'CET (UTC+1)', 'austria': 'CET (UTC+1)',
      'prague': 'CET (UTC+1)', 'czech': 'CET (UTC+1)',
      'budapest': 'CET (UTC+1)', 'hungary': 'CET (UTC+1)',
      'athens': 'EET (UTC+2)', 'greece': 'EET (UTC+2)',
      'lisbon': 'WET (UTC+0)', 'portugal': 'WET (UTC+0)',
      'stockholm': 'CET (UTC+1)', 'sweden': 'CET (UTC+1)',
      'oslo': 'CET (UTC+1)', 'norway': 'CET (UTC+1)',
      'copenhagen': 'CET (UTC+1)', 'denmark': 'CET (UTC+1)',
      'zurich': 'CET (UTC+1)', 'switzerland': 'CET (UTC+1)',
      'brussels': 'CET (UTC+1)', 'belgium': 'CET (UTC+1)',
      
      // Asia
      'tokyo': 'JST (UTC+9)', 'japan': 'JST (UTC+9)', 'osaka': 'JST (UTC+9)', 'kyoto': 'JST (UTC+9)',
      'beijing': 'CST (UTC+8)', 'china': 'CST (UTC+8)', 'shanghai': 'CST (UTC+8)',
      'mumbai': 'IST (UTC+5:30)', 'delhi': 'IST (UTC+5:30)', 'india': 'IST (UTC+5:30)', 'bangalore': 'IST (UTC+5:30)', 'kolkata': 'IST (UTC+5:30)',
      'singapore': 'SGT (UTC+8)',
      'bangkok': 'ICT (UTC+7)', 'thailand': 'ICT (UTC+7)',
      'kuala lumpur': 'MYT (UTC+8)', 'malaysia': 'MYT (UTC+8)',
      'jakarta': 'WIB (UTC+7)', 'indonesia': 'WIB (UTC+7)',
      'manila': 'PHT (UTC+8)', 'philippines': 'PHT (UTC+8)',
      'seoul': 'KST (UTC+9)', 'south korea': 'KST (UTC+9)', 'korea': 'KST (UTC+9)',
      'hanoi': 'ICT (UTC+7)', 'vietnam': 'ICT (UTC+7)', 'ho chi minh': 'ICT (UTC+7)',
      'hong kong': 'HKT (UTC+8)', 'taipei': 'CST (UTC+8)', 'taiwan': 'CST (UTC+8)',
      
      // Middle East
      'dubai': 'GST (UTC+4)', 'uae': 'GST (UTC+4)', 'abu dhabi': 'GST (UTC+4)',
      'riyadh': 'AST (UTC+3)', 'saudi arabia': 'AST (UTC+3)',
      'doha': 'AST (UTC+3)', 'qatar': 'AST (UTC+3)',
      'tel aviv': 'IST (UTC+2)', 'israel': 'IST (UTC+2)',
      'istanbul': 'TRT (UTC+3)', 'turkey': 'TRT (UTC+3)',
      
      // Americas
      'new york': 'EST (UTC-5)', 'usa': 'EST (UTC-5)', 'united states': 'EST (UTC-5)', 'america': 'EST (UTC-5)',
      'los angeles': 'PST (UTC-8)', 'chicago': 'CST (UTC-6)', 'miami': 'EST (UTC-5)', 'san francisco': 'PST (UTC-8)',
      'toronto': 'EST (UTC-5)', 'canada': 'EST (UTC-5)', 'vancouver': 'PST (UTC-8)',
      'mexico city': 'CST (UTC-6)', 'mexico': 'CST (UTC-6)',
      'rio de janeiro': 'BRT (UTC-3)', 'brazil': 'BRT (UTC-3)', 'sao paulo': 'BRT (UTC-3)',
      'buenos aires': 'ART (UTC-3)', 'argentina': 'ART (UTC-3)',
      'lima': 'PET (UTC-5)', 'peru': 'PET (UTC-5)',
      'bogota': 'COT (UTC-5)', 'colombia': 'COT (UTC-5)',
      
      // Oceania
      'sydney': 'AEST (UTC+10)', 'australia': 'AEST (UTC+10)', 'melbourne': 'AEST (UTC+10)',
      'auckland': 'NZST (UTC+12)', 'new zealand': 'NZST (UTC+12)',
      
      // Africa
      'cairo': 'EET (UTC+2)', 'egypt': 'EET (UTC+2)',
      'cape town': 'SAST (UTC+2)', 'south africa': 'SAST (UTC+2)',
      'nairobi': 'EAT (UTC+3)', 'kenya': 'EAT (UTC+3)',
      'marrakech': 'WET (UTC+0)', 'morocco': 'WET (UTC+0)',
    };

    // Comprehensive best time to visit mapping
    const bestTimeMap: { [key: string]: string } = {
      // Europe
      'paris': 'Apr-Jun, Sep-Oct', 'france': 'Apr-Jun, Sep-Oct', 'lyon': 'Apr-Jun, Sep-Oct', 'marseille': 'Apr-Jun, Sep-Oct',
      'london': 'May-Sep', 'uk': 'May-Sep', 'united kingdom': 'May-Sep', 'britain': 'May-Sep',
      'rome': 'Apr-Jun, Sep-Oct', 'italy': 'Apr-Jun, Sep-Oct', 'milan': 'Apr-Jun, Sep-Oct', 'venice': 'Apr-Jun, Sep-Oct',
      'madrid': 'Mar-May, Sep-Nov', 'spain': 'Mar-May, Sep-Nov', 'barcelona': 'May-Jun, Sep-Oct',
      'berlin': 'May-Sep', 'germany': 'May-Sep', 'munich': 'May-Sep',
      'amsterdam': 'Apr-Jun, Sep-Oct', 'netherlands': 'Apr-Jun, Sep-Oct',
      'vienna': 'Apr-Jun, Sep-Oct', 'austria': 'Apr-Jun, Sep-Oct',
      'prague': 'May-Sep', 'czech': 'May-Sep',
      'budapest': 'Apr-Jun, Sep-Oct', 'hungary': 'Apr-Jun, Sep-Oct',
      'athens': 'Apr-Jun, Sep-Oct', 'greece': 'Apr-Jun, Sep-Oct',
      'lisbon': 'Mar-May, Sep-Nov', 'portugal': 'Mar-May, Sep-Nov',
      'stockholm': 'Jun-Aug', 'sweden': 'Jun-Aug',
      'oslo': 'Jun-Aug', 'norway': 'Jun-Aug',
      'copenhagen': 'May-Sep', 'denmark': 'May-Sep',
      'zurich': 'Jun-Sep', 'switzerland': 'Jun-Sep',
      'brussels': 'Apr-Jun, Sep-Oct', 'belgium': 'Apr-Jun, Sep-Oct',
      
      // Asia
      'tokyo': 'Mar-May, Sep-Nov', 'japan': 'Mar-May, Sep-Nov', 'osaka': 'Mar-May, Sep-Nov', 'kyoto': 'Mar-May, Sep-Nov',
      'beijing': 'Apr-Jun, Sep-Oct', 'china': 'Apr-Jun, Sep-Oct', 'shanghai': 'Apr-Jun, Sep-Oct',
      'mumbai': 'Nov-Feb', 'delhi': 'Oct-Mar', 'india': 'Oct-Mar', 'bangalore': 'Oct-Feb', 'kolkata': 'Oct-Mar',
      'singapore': 'Feb-Apr',
      'bangkok': 'Nov-Mar', 'thailand': 'Nov-Mar',
      'kuala lumpur': 'Dec-Feb', 'malaysia': 'Dec-Feb',
      'jakarta': 'May-Oct', 'indonesia': 'May-Oct',
      'manila': 'Nov-Apr', 'philippines': 'Nov-Apr',
      'seoul': 'Mar-May, Sep-Nov', 'south korea': 'Mar-May, Sep-Nov', 'korea': 'Mar-May, Sep-Nov',
      'hanoi': 'Oct-Apr', 'vietnam': 'Oct-Apr', 'ho chi minh': 'Dec-Apr',
      'hong kong': 'Oct-Apr', 'taipei': 'Mar-May, Oct-Nov', 'taiwan': 'Mar-May, Oct-Nov',
      
      // Middle East
      'dubai': 'Nov-Mar', 'uae': 'Nov-Mar', 'abu dhabi': 'Nov-Mar',
      'riyadh': 'Nov-Mar', 'saudi arabia': 'Nov-Mar',
      'doha': 'Nov-Mar', 'qatar': 'Nov-Mar',
      'tel aviv': 'Apr-May, Sep-Nov', 'israel': 'Apr-May, Sep-Nov',
      'istanbul': 'Apr-May, Sep-Oct', 'turkey': 'Apr-May, Sep-Oct',
      
      // Americas
      'new york': 'Apr-Jun, Sep-Nov', 'usa': 'Apr-Jun, Sep-Nov', 'united states': 'Apr-Jun, Sep-Nov', 'america': 'Apr-Jun, Sep-Nov',
      'los angeles': 'Mar-May, Sep-Nov', 'chicago': 'May-Jun, Sep-Oct', 'miami': 'Dec-Apr', 'san francisco': 'Sep-Nov',
      'toronto': 'May-Oct', 'canada': 'Jun-Aug', 'vancouver': 'Jun-Sep',
      'mexico city': 'Nov-Apr', 'mexico': 'Nov-Apr',
      'rio de janeiro': 'Dec-Mar', 'brazil': 'Dec-Mar', 'sao paulo': 'Mar-May, Sep-Nov',
      'buenos aires': 'Oct-Apr', 'argentina': 'Oct-Apr',
      'lima': 'May-Sep', 'peru': 'May-Sep',
      'bogota': 'Dec-Mar', 'colombia': 'Dec-Mar',
      
      // Oceania
      'sydney': 'Sep-Nov, Mar-May', 'australia': 'Sep-Nov, Mar-May', 'melbourne': 'Sep-Nov, Mar-May',
      'auckland': 'Dec-Feb', 'new zealand': 'Dec-Feb',
      
      // Africa
      'cairo': 'Oct-Apr', 'egypt': 'Oct-Apr',
      'cape town': 'Nov-Feb', 'south africa': 'Nov-Feb',
      'nairobi': 'Jan-Mar, Jul-Oct', 'kenya': 'Jan-Mar, Jul-Oct',
      'marrakech': 'Mar-May, Sep-Nov', 'morocco': 'Mar-May, Sep-Nov',
    };

    // Try to find match - first check city name, then full destination
    const findMatch = (map: { [key: string]: string }, searchText: string): string | null => {
      // Try exact city match first
      if (map[cityName]) return map[cityName];
      
      // Try full destination match
      if (map[searchText]) return map[searchText];
      
      // Try partial matches
      for (const [key, value] of Object.entries(map)) {
        if (searchText.includes(key) || key.includes(cityName)) {
          return value;
        }
      }
      
      return null;
    };

    // Get values with fallbacks
    const currency = findMatch(currencyMap, destLower) || 'USD ($)';
    const language = findMatch(languageMap, destLower) || 'English';
    const timezone = findMatch(timezoneMap, destLower) || 'UTC+0 (GMT)';
    const bestTime = findMatch(bestTimeMap, destLower) || 'Mar-May, Sep-Nov';

    return { currency, language, timezone, bestTime };
  };

  const destInfo = getDestinationInfo(itinerary.destination);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Trip Statistics</h4>
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <FiCalendar className="w-4 h-4 mr-2 text-blue-600" />
            <span>Total Days</span>
          </div>
          <span className="font-semibold text-gray-900">{itinerary.totalDays}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <FiActivity className="w-4 h-4 mr-2 text-purple-600" />
            <span>Total Activities</span>
          </div>
          <span className="font-semibold text-gray-900">{totalActivities}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <FiDollarSign className="w-4 h-4 mr-2 text-green-600" />
            <span>Budget/Day</span>
          </div>
          <span className="font-semibold text-gray-900">₹{parseInt(budgetPerDay).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-blue-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Destination Info</h4>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <FiDollarSign className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
            <span className="truncate"><span className="font-medium">Currency:</span> {destInfo.currency}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FiGlobe className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
            <span className="truncate"><span className="font-medium">Timezone:</span> {destInfo.timezone}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FiMessageCircle className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" />
            <span className="truncate"><span className="font-medium">Language:</span> {destInfo.language}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FiSun className="w-4 h-4 mr-2 text-yellow-600 flex-shrink-0" />
            <span className="truncate"><span className="font-medium">Best Time:</span> {destInfo.bestTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

