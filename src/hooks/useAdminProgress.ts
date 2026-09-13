import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Project {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface ProjectStage {
  id: number;
  project_id: number;
  stage_order: number;
  stage_name: string;
  stamp_image_url: string;
}

export function useAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // THAO TÁC VỚI PROJECTS
  // ==========================================
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Lỗi tải dự án:', error.message);
    } else if (data) {
      setProjects(data);
    }
    setIsLoading(false);
  }, []);

  const addProject = async (projectData: Omit<Project, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Current Logged-in User ID:", user?.id);
    const { data, error } = await supabase.from('projects').insert([projectData]).select();
    if (error) {
      console.error('Lỗi thêm dự án:', error.message);
      return false;
    }
    if (data) setProjects((prev) => [data[0], ...prev]);
    return true;
  };

  const updateProject = async (id: number, projectData: Partial<Project>) => {
    const { data, error } = await supabase.from('projects').update(projectData).eq('id', id).select();
    if (error) {
      console.error('Lỗi cập nhật dự án:', error.message);
      return false;
    }
    if (data) setProjects((prev) => prev.map((p) => (p.id === id ? data[0] : p)));
    return true;
  };

  const deleteProject = async (id: number) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      console.error('Lỗi xóa dự án:', error.message);
      return false;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  // ==========================================
  // THAO TÁC VỚI STAGES
  // ==========================================
  const fetchStages = useCallback(async (projectId: number) => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', Number(projectId)) // Ép kiểu số để tránh rỗng data
      .order('stage_order', { ascending: true });

    if (error) {
      console.error('Lỗi tải chặng:', error.message);
    } else if (data) {
      console.log('✅ Dữ liệu stages lấy về từ Supabase:', data);
      setStages(data);
    }
  }, []);

  const addStage = async (stageData: Omit<ProjectStage, 'id'>) => {
    const formattedData = {
      ...stageData,
      project_id: Number(stageData.project_id),
      stage_order: Number(stageData.stage_order)
    };

    const { data, error } = await supabase.from('project_stages').insert([formattedData]).select();
    if (error) {
      console.error('Lỗi thêm chặng:', error.message);
      return false;
    }
    if (data) {
      setStages((prev) => [...prev, data[0]].sort((a, b) => a.stage_order - b.stage_order));
    }
    return true;
  };

  const updateStage = async (id: number, stageData: Partial<ProjectStage>) => {
    const formattedData = {
      ...stageData,
      ...(stageData.project_id && { project_id: Number(stageData.project_id) }),
      ...(stageData.stage_order && { stage_order: Number(stageData.stage_order) })
    };

    const { data, error } = await supabase.from('project_stages').update(formattedData).eq('id', id).select();
    if (error) {
      console.error('Lỗi cập nhật chặng:', error.message);
      return false;
    }
    if (data) {
      setStages((prev) => prev.map((s) => (s.id === id ? data[0] : s)).sort((a, b) => a.stage_order - b.stage_order));
    }
    return true;
  };

  const deleteStage = async (id: number) => {
    const { error } = await supabase.from('project_stages').delete().eq('id', id);
    if (error) {
      console.error('Lỗi xóa chặng:', error.message);
      return false;
    }
    setStages((prev) => prev.filter((s) => s.id !== id));
    return true;
  };

  // ==========================================
  // THAO TÁC UPLOAD ẢNH BUCKET
  // ==========================================
  const uploadStampImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `stamp_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      // 1. Tải lên bucket 'stamp' (không có s)
      const { error: uploadError } = await supabase.storage
        .from('stamp')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Lỗi upload ảnh:', uploadError.message);
        return null;
      }

      // 2. Lấy link URL từ đúng bucket 'stamp' (không có s)
      const { data } = supabase.storage
        .from('stamp')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Lỗi ngoại lệ khi upload ảnh:', error);
      return null;
    }
  };

  return {
    projects,
    stages,
    isLoading,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    fetchStages,
    addStage,
    updateStage,
    deleteStage,
    uploadStampImage,
  };
}