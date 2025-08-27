import { Request, Response, NextFunction } from "express";
import UserNoteModel from "../models/userNoteSchema";
import ErrorHandler from "../utils/errorHandlerClass";


// CREATE
export const createUserNoteHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const { planId, sessionId, comments } = req.body;

    if (!userId || !planId || !sessionId || !comments) {
      throw new ErrorHandler(400, "Missing required fields")
    }

    const note = await UserNoteModel.create({
      user: userId,
      rehabPlan: planId,
      session: sessionId,
      comments: comments.trim(),
    });

   res.status(201).json({ 
    success: true,
    message: "Note created", 
    // data: note 
  });
  } catch (err: any) {
    console.error('Error in createUserNote:', err
      
    )
    if (err?.code === 11000) {
      return next(new ErrorHandler(409, "Note for this session already exists"));
    }
    next(err);
  }
};

// LIST ALL FOR USER (optionally by plan or session)
export const listUserNotesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const { planId, sessionId } = req.query;

    const notes = await UserNoteModel.find({
      userId,
      rehabPlanId: planId,
      sessionId: sessionId
    }).sort({ createdAt: -1 }).populate('rehabPlan').populate('session').populate('userProgress');

    return res.status(200).json({
      success: true,
      data: notes
    });
  } catch (err) {
    next(err);
  }
};

// GET ONE
export const getUserNoteHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const { noteId } = req.params;
    console.log(noteId);
    
    if(!noteId) throw new ErrorHandler(400, "Note ID is required");

    const note = await UserNoteModel.findOne({_id: noteId})
      // .populate('rehabPlan')
      .populate('session')
      // .populate('userProgress');
    
    if (!note) return res.status(404).json({ message: "Note not found" });

    return res.status(200).json({ 
      success: true,
      data: note 
    });

  } catch (err) {
    console.error('Error in getUserNote:', err)
    next(err);
  }
};

// UPDATE
// export const updateUserNote = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = (req as any).userId;
//     const { noteId } = req.params;
//     const { content } = req.body;

//     const note = await UserNoteModel.findOneAndUpdate(
//       { _id: noteId, user: userId },
//       { content: content?.trim() },
//       { new: true }
//     );

//     if (!note) return res.status(404).json({ message: "Note not found" });
//     return res.status(200).json({ message: "Note updated", data: note });
//   } catch (err) {
//     next(err);
//   }
// };

// DELETE
export const deleteUserNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { noteId } = req.params;

    const note = await UserNoteModel.findOneAndDelete({ _id: noteId, user: userId });
    if (!note) return res.status(404).json({ message: "Note not found" });

    return res.status(200).json({ message: "Note deleted" });
  } catch (err) {
    next(err);
  }
};
