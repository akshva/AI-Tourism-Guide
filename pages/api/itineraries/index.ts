import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/mongodb';
import Itinerary from '@/models/Itinerary';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const itineraries = await Itinerary.find({
        $or: [
          { userId: session.user.id },
          { collaborators: session.user.id },
        ],
      })
        .populate('userId', 'name email')
        .populate('collaborators', 'name email')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: itineraries,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const itinerary = await Itinerary.create({
        ...req.body,
        userId: session.user.id,
      });

      return res.status(201).json({
        success: true,
        data: itinerary,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

