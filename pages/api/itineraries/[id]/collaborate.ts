import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '@/lib/mongodb';
import Itinerary from '@/models/Itinerary';
import User from '@/models/User';
import mongoose from 'mongoose';

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

  if (req.method === 'POST') {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Please provide an email' });
      }

      const itinerary = await Itinerary.findOne({
        _id: id,
        userId: session.user.id,
      });

      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found or you do not have permission' });
      }

      const collaborator = await User.findOne({ email });

      if (!collaborator) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (collaborator._id.toString() === session.user.id) {
        return res.status(400).json({ message: 'You cannot add yourself as a collaborator' });
      }

      if (itinerary.collaborators.some((id) => id.toString() === collaborator._id.toString())) {
        return res.status(400).json({ message: 'User is already a collaborator' });
      }

      itinerary.collaborators.push(new mongoose.Types.ObjectId(collaborator._id));
      await itinerary.save();

      const updatedItinerary = await Itinerary.findById(id)
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
      const { collaboratorId } = req.body;

      if (!collaboratorId) {
        return res.status(400).json({ message: 'Please provide a collaborator ID' });
      }

      const itinerary = await Itinerary.findOne({
        _id: id,
        userId: session.user.id,
      });

      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found or you do not have permission' });
      }

      itinerary.collaborators = itinerary.collaborators.filter(
        (collabId) => collabId.toString() !== collaboratorId
      );
      await itinerary.save();

      const updatedItinerary = await Itinerary.findById(id)
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

  return res.status(405).json({ message: 'Method not allowed' });
}

