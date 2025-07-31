import cloudinary from "../../config/cloudinaryConfig";

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> => {
  try {
    console.log(`Attempting to delete ${resourceType} with public ID:`, publicId);
    console.log(`Cloudinary config - cloud_name: ${cloudinary.config().cloud_name}`);
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    console.log(`Successfully deleted ${resourceType} from Cloudinary:`, result);
    
    if (result.result === 'not found') {
      console.log(`Warning: ${resourceType} with public ID '${publicId}' was not found in Cloudinary`);
      console.log('This could mean:');
      console.log('1. The file was already deleted');
      console.log('2. The public ID is incorrect');
      console.log('3. The file is in a different folder/account');
    }
  } catch (error) {
    console.error(`Error deleting ${resourceType} from Cloudinary:`, error);
    // Don't throw error as this is cleanup operation
  }
};