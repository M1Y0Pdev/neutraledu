import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for lessons only
export interface Lesson {
  id: string
  title: string
  content: string
  subject: string
  grade_level: string
  cover_image_url?: string
  video_url?: string
  attachments?: any[]
  interactive_questions?: any[]
  created_at: string
  updated_at: string
}

// Lesson service functions
export const lessonService = {
  // Test bucket access
  async testBucketAccess() {
    try {
      const { data, error } = await supabase.storage
        .from('lesson-files')
        .list('', { limit: 1 })
      
      if (error) {
        console.error('Bucket access error:', error);
        return { success: false, error: error.message };
      }
      
      console.log('Bucket access successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Bucket test failed:', error);
      return { success: false, error: error };
    }
  },

  // Get all lessons
  async getAllLessons() {
    console.log('Calling getAllLessons...');
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('Supabase response:', { data, error });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return data as Lesson[]
  },

  // Get lesson by ID
  async getLessonById(id: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Lesson
  },

  // Create new lesson
  async createLesson(lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) {
    console.log('Creating lesson:', lesson);
    const { data, error } = await supabase
      .from('lessons')
      .insert(lesson)
      .select()
      .single()
    
    console.log('Create lesson response:', { data, error });
    
    if (error) throw error
    return data as Lesson
  },

  // Update lesson
  async updateLesson(id: string, updates: Partial<Lesson>) {
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Lesson
  },

  // Delete lesson
  async deleteLesson(id: string) {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Upload file to Supabase Storage
  async uploadFile(file: File, path: string) {
    console.log('Uploading file:', { name: file.name, size: file.size, path });
    
    const { data, error } = await supabase.storage
      .from('lesson-files')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
    
    console.log('Upload successful:', data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('lesson-files')
      .getPublicUrl(path)
    
    console.log('Public URL:', publicUrl);
    return publicUrl
  },

  // Delete file from Supabase Storage
  async deleteFile(path: string) {
    const { error } = await supabase.storage
      .from('lesson-files')
      .remove([path])
    
    if (error) throw error
  }
} 