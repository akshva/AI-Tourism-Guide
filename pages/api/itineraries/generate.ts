import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/mongodb';
import Itinerary from '@/models/Itinerary';
import { generateItinerary } from '@/lib/gemini';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { destination, days, budget, interests } = req.body;

    if (!destination || !days || !budget) {
      return res.status(400).json({ message: 'Please provide destination, days, and budget' });
    }

    // Connect to database
    try {
      await dbConnect();
      console.log('Database connected successfully');
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      const errorMsg = dbError.message || 'Unknown database error';
      
      // Provide more helpful error messages for common issues
      let helpfulMessage = 'Database connection failed. ';
      if (errorMsg.includes('authentication failed') || errorMsg.includes('bad auth')) {
        helpfulMessage += 'Authentication failed. Please check:\n';
        helpfulMessage += '1. Your MongoDB username is correct\n';
        helpfulMessage += '2. Your MongoDB password is correct (replace <akshi> with actual password)\n';
        helpfulMessage += '3. The password is URL-encoded if it contains special characters\n';
        helpfulMessage += '4. Your database user has proper permissions';
      } else if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo') || errorMsg.includes('whitelist') || errorMsg.includes('Could not connect')) {
        helpfulMessage += 'Cannot connect to MongoDB server. Your IP address may not be whitelisted.\n';
        helpfulMessage += 'Please:\n';
        helpfulMessage += '1. Go to MongoDB Atlas: https://cloud.mongodb.com/\n';
        helpfulMessage += '2. Click "Network Access" in the left sidebar\n';
        helpfulMessage += '3. Click "Add IP Address"\n';
        helpfulMessage += '4. Select "Allow Access from Anywhere" (for development)\n';
        helpfulMessage += '5. Wait 1-2 minutes and try again\n';
        helpfulMessage += 'See FIX_IP_WHITELIST.md for detailed instructions.';
      } else {
        helpfulMessage += 'Error: ' + errorMsg;
      }
      
      return res.status(500).json({ 
        message: helpfulMessage
      });
    }

    // Generate itinerary using Gemini AI
    console.log('Generating itinerary for:', { destination, days, budget, interests });
    const itineraryData = await generateItinerary(
      destination,
      parseInt(days),
      budget,
      interests || []
    );

    console.log('Received itinerary data (first 500 chars):', itineraryData.substring(0, 500));

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(itineraryData);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError);
      console.error('Data received:', itineraryData);
      
      // If parsing fails, try to extract JSON from markdown or clean up
      let cleanedData = itineraryData;
      
      // Remove markdown code blocks
      cleanedData = cleanedData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to extract JSON object
      const jsonMatch = cleanedData.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error('Failed to parse itinerary data: ' + parseError.message);
        }
      } else {
        throw new Error('Failed to parse itinerary data: No valid JSON found. ' + parseError.message);
      }
    }
    
    // Validate required fields
    if (!parsedData.days || !Array.isArray(parsedData.days)) {
      throw new Error('Invalid itinerary data: Missing days array');
    }
    
    // Ensure we have at least one day
    if (parsedData.days.length === 0) {
      throw new Error('Invalid itinerary data: No days generated');
    }

    // Create itinerary in database
    const itinerary = await Itinerary.create({
      userId: session.user.id,
      title: `${destination} - ${days} Day${days > 1 ? 's' : ''} Trip`,
      destination: parsedData.destination || destination,
      totalDays: parsedData.totalDays || parseInt(days),
      budget: parsedData.budget || budget,
      interests: parsedData.interests || interests || [],
      days: parsedData.days || [],
      summary: parsedData.summary || {
        totalEstimatedCost: budget,
        highlights: [],
        tips: [],
      },
      collaborators: [],
      isPublic: false,
    });

    return res.status(201).json({
      success: true,
      data: itinerary,
    });
  } catch (error: any) {
    console.error('Error generating itinerary:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate itinerary. Please try again.';
    
    if (error.message) {
      errorMessage = error.message;
      
      // Add helpful hints for common errors
      if (error.message.includes('API key') || error.message.includes('GEMINI_API_KEY')) {
        const isVercel = process.env.VERCEL === '1';
        if (isVercel) {
          errorMessage += ' Please check your GEMINI_API_KEY in Vercel project settings: Settings → Environment Variables. Make sure it\'s set for all environments (Production, Preview, Development).';
        } else {
          errorMessage += ' Please check your GEMINI_API_KEY in .env.local';
        }
      } else if (error.message.includes('MongoDB') || error.message.includes('database')) {
        errorMessage += ' Please check your MONGODB_URI in .env.local';
      } else if (error.message.includes('parse') || error.message.includes('JSON')) {
        errorMessage += ' The AI response was invalid. Please try again.';
      }
    }
    
    return res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

