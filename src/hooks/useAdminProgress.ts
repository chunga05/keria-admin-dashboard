import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { uploadFileToR2 } from '@/lib/uploadR2Client';
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  createProjectStageAction,
  updateProjectStageAction,
  deleteProjectStageAction,
} from '@/app/(admin)/actions/adminActions';

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
    const res = await createProjectAction(projectData);
    if (!res.success) {
      console.error('Lỗi thêm dự án:', res.message);
      return false;
    }
    if (res.data) setProjects((prev) => [res.data[0], ...prev]);
    return true;
  };

  const updateProject = async (id: number, projectData: Partial<Project>) => {
    const res = await updateProjectAction(id, projectData);
    if (!res.success) {
      console.error('Lỗi cập nhật dự án:', res.message);
      return false;
    }
    if (res.data) setProjects((prev) => prev.map((p) => (p.id === id ? res.data[0] : p)));
    return true;
  };

  const deleteProject = async (id: number) => {
    const res = await deleteProjectAction(id);
    if (!res.success) {
      console.error('Lỗi xóa dự án:', res.message);
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
      .eq('project_id', Number(projectId))
      .order('stage_order', { ascending: true });

    if (error) {
      console.error('Lỗi tải chặng:', error.message);
    } else if (data) {
      setStages(data);
    }
  }, []);

  const addStage = async (stageData: Omit<ProjectStage, 'id'>) => {
    const formattedData = {
      ...stageData,
      project_id: Number(stageData.project_id),
      stage_order: Number(stageData.stage_order)
    };

    const res = await createProjectStageAction(formattedData);
    if (!res.success) {
      console.error('Lỗi thêm chặng:', res.message);
      return false;
    }
    if (res.data) {
      setStages((prev) => [...prev, res.data[0]].sort((a, b) => a.stage_order - b.stage_order));
    }
    return true;
  };

  const updateStage = async (id: number, stageData: Partial<ProjectStage>) => {
    const formattedData = {
      ...stageData,
      ...(stageData.project_id && { project_id: Number(stageData.project_id) }),
      ...(stageData.stage_order && { stage_order: Number(stageData.stage_order) })
    };

    const res = await updateProjectStageAction(id, formattedData);
    if (!res.success) {
      console.error('Lỗi cập nhật chặng:', res.message);
      return false;
    }
    if (res.data) {
      setStages((prev) => prev.map((s) => (s.id === id ? res.data[0] : s)).sort((a, b) => a.stage_order - b.stage_order));
    }
    return true;
  };

  const deleteStage = async (id: number) => {
    const res = await deleteProjectStageAction(id);
    if (!res.success) {
      console.error('Lỗi xóa chặng:', res.message);
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
      // Tải lên R2 thay vì Supabase Storage
      const publicUrl = await uploadFileToR2(file, 'stamps');
      return publicUrl;
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