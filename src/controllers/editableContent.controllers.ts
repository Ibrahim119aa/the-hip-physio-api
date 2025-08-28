import { NextFunction, Request, Response } from "express";

import ErrorHandler from "../utils/errorHandlerClass";
import { EditableContentModel } from "../models/editableContent.model";

const ALLOWED_SLUGS = new Set(["privacy-policy", "terms-and-conditions", "help-faqs"]);

export async function createContentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { title, html } = req.body;
    const userId = req.userId;
  
    if (!ALLOWED_SLUGS.has(slug)) throw new ErrorHandler(400, "Invalid slug");
  
    // const existing = await ContentPage.findOne({ slug });
    // if (existing) {
    //   return res.status(409).json({ error: "Content already exists" });
    // }
  
    // const parsed = contentPageUpsertSchema.safeParse(req.body);
    // if (!parsed.success) {
    //   return res.status(422).json({ error: parsed.error.flatten() });
    // }
  
    // const { title, html } = parsed.data;
    // const sanitizedHtml = sanitizeHtmlUnsafe(html);
  
    const doc = await EditableContentModel.create({
      slug,
      title,
      // html: sanitizedHtml,
      contentHtml: html,
      updatedBy: userId,
    });
  
    res.status(201).json({
      sucess: true,
      message: "Content created successfully",
      data: doc
    });
    
  } catch (error) {
    console.error("Error creating content:", error);
    next(error)
  }
}

export const updateContentHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { title, contentHtml } = req.body;
    const userId = req.userId;
    console.log('req.body', req.body)
    if (!ALLOWED_SLUGS.has(slug)) throw new ErrorHandler(400, "Invalid slug");

    if (typeof contentHtml !== "string" || contentHtml.trim() === "") throw new ErrorHandler(400, "contentHtml is required") 

    const doc = await EditableContentModel.findOneAndUpdate(
      { slug },
      { 
        ...(title !== undefined ? { title } : {}),
        contentHtml, 
        updatedBy: userId 
      },
      { new: true }
    );

    if (!doc) throw new ErrorHandler(404, "Content not found");

    res.status(200).json({
      success: true,
      message: "Content updated successfully",
      data: doc
    });

  } catch (error) {
    console.error("Error updating content:", error);
    next(error)
  }
}

export const getSingleContentHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    if (!ALLOWED_SLUGS.has(slug)) throw new ErrorHandler(400, "Invalid slug");

    const doc = await EditableContentModel.findOne({ slug });

    if (!doc) throw new ErrorHandler(404, "Content not found");

    res.status(200).json({
      success: true,
      message: "Content fetched successfully",
      data: doc
    })

  } catch (error) {
    console.error("Error fetching content:", error);
    next(error)
  }
}

export const deleteContentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    if (!ALLOWED_SLUGS.has(slug)) throw new ErrorHandler(400, "Invalid slug");

    const doc = await EditableContentModel.findOneAndDelete({ slug });

    if (!doc) throw new ErrorHandler(404, "Content not found");

    res.status(200).json({
      success: true,
      message: "Content deleted successfully",
    })
    
  } catch (error) {
    console.error("Error deleting content:", error);
    next(error)
  }
}

export const getAllContentHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await EditableContentModel.find({ slug: { $in: Array.from(ALLOWED_SLUGS) } })
      .sort({ slug: 1 })
      .lean();
    
    res.status(200).json({
      success: true,
      message: "All content fetched successfully",
      data: docs
    })
    
  } catch (error) {
    console.error("Error fetching all content:", error);
    next(error)
  }
}

// export async function listContent(req: Request, res: Response, next: NextFunction) {
//   try {
//     const items = await EditableContentModel.find({ slug: { $in: Array.from(ALLOWED_SLUGS) } })
//       .select("slug title updatedAt")
//       .sort({ slug: 1 })
//       .lean();
//     res.json(items);
    
//   } catch (error) {
//     console.error("Error fetching content:", error)
//     next(error);
//   }
// }