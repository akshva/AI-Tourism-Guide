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

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const itinerary = await Itinerary.findOne({
        _id: id,
        $or: [
          { userId: session.user.id },
          { collaborators: session.user.id },
          { isPublic: true },
        ],
      })
        .populate('userId', 'name email')
        .populate('collaborators', 'name email');

      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found' });
      }

      return res.status(200).json({
        success: true,
        data: itinerary,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const itinerary = await Itinerary.findOne({
        _id: id,
        $or: [
          { userId: session.user.id },
          { collaborators: session.user.id },
        ],
      });

      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found or you do not have permission' });
      }

      const updatedItinerary = await Itinerary.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate('userId', 'name email')
        .populate('collaborators', 'name email');

      return res.status(200).json({
        success: true,
        data: updatedItinerary,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const itinerary = await Itinerary.findOne({
        _id: id,
        userId: session.user.id,
      });

      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found or you do not have permission' });
      }

      await Itinerary.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Itinerary deleted successfully',
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

