'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, X, Layers, CheckCircle, XCircle } from 'lucide-react';
import { useAdmin, Project, ProjectStage } from '@/hooks/useAdminProgress';

export default function AdminProjectsManagement() {
  const {
    projects,
    stages,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    fetchStages,
    addStage,
    updateStage,
    deleteStage,
    uploadStampImage, // Đã thêm hàm upload từ hook
  } = useAdmin();

  // States UI cho Modal Dự án
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState<Partial<Project>>({});
  
  // States UI cho Modal Quản lý Chặng (Stages) của từng Dự án
  const [activeProjectForStages, setActiveProjectForStages] = useState<Project | null>(null);
  const [stageForm, setStageForm] = useState<Partial<ProjectStage>>({});
  const [isEditingStage, setIsEditingStage] = useState(false);
  
  // Trạng thái loading khi đang tải ảnh lên Supabase
  const [isUploadingStamp, setIsUploadingStamp] = useState(false);

  // Load danh sách Project khi vào trang
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ==============================
  // XỬ LÝ SỰ KIỆN DỰ ÁN (PROJECT)
  // ==============================
  const handleOpenProjectModal = (project?: Project) => {
    if (project) setProjectForm(project);
    else setProjectForm({ title: '', description: '', start_date: '', end_date: '', is_active: true });
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    let success = false;
    if (projectForm.id) {
      success = await updateProject(projectForm.id, projectForm);
    } else {
      success = await addProject(projectForm as Omit<Project, 'id'>);
    }
    if (success) setIsProjectModalOpen(false);
  };

  const handleDeleteProject = async (id: number) => {
    if (confirm('Xóa dự án này? (Hãy chắc chắn đã xóa hết các chặng con liên quan trước)')) {
      await deleteProject(id);
    }
  };

  // ==============================
  // XỬ LÝ SỰ KIỆN CHẶNG (STAGE)
  // ==============================
  const handleOpenStagesManager = (project: Project) => {
    setActiveProjectForStages(project);
    fetchStages(project.id);
    setStageForm({ project_id: project.id, stage_order: 1, stage_name: '', stamp_image_url: '' });
    setIsEditingStage(false);
  };

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    let success = false;
    if (stageForm.id) {
      success = await updateStage(stageForm.id, stageForm);
    } else {
      success = await addStage(stageForm as Omit<ProjectStage, 'id'>);
    }
    
    if (success) {
      setStageForm({ 
        project_id: activeProjectForStages?.id, 
        stage_order: (stageForm.stage_order || 1) + 1, 
        stage_name: '', 
        stamp_image_url: '' 
      });
      setIsEditingStage(false);
    }
  };

  const handleEditStage = (stage: ProjectStage) => {
    setStageForm(stage);
    setIsEditingStage(true);
  };

  const handleDeleteStage = async (id: number) => {
    if (confirm('Bạn muốn xóa chặng này?')) {
      await deleteStage(id);
    }
  };

  // Hàm xử lý upload ảnh stamp
  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingStamp(true);
    
    try {
      // Gọi hàm đẩy ảnh lên Supabase
      if (uploadStampImage) {
        const publicUrl = await uploadStampImage(file);
        
        if (publicUrl) {
          // Cập nhật URL vào form data
          setStageForm(prev => ({ ...prev, stamp_image_url: publicUrl }));
        } else {
          alert("Tải ảnh thất bại! Vui lòng thử lại.");
        }
      } else {
        alert("Chưa cấu hình hàm uploadStampImage trong useAdmin hook.");
      }
    } catch (error) {
      console.error("Lỗi khi tải ảnh:", error);
      alert("Đã xảy ra lỗi khi tải ảnh.");
    } finally {
      setIsUploadingStamp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="mx-auto max-w-7xl">
        
        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Dự án & Chặng</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý danh sách project và các chặng con (stages) tương ứng.</p>
          </div>
          <button
            onClick={() => handleOpenProjectModal()}
            className="flex items-center gap-2 rounded-lg bg-[#0086ff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" /> Thêm Dự án
          </button>
        </div>

        {/* BẢNG PROJECTS */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold w-16">ID</th>
                <th className="px-6 py-4 font-semibold">Tên Dự án (Title)</th>
                <th className="px-6 py-4 font-semibold">Thời gian (Start - End)</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    Chưa có dự án nào được tạo.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{project.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{project.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[250px]">{project.description}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {project.start_date} <br/> <span className="text-gray-400">đến</span> {project.end_date}
                    </td>
                    <td className="px-6 py-4">
                      {project.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          <CheckCircle className="h-3 w-3"/> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">
                          <XCircle className="h-3 w-3"/> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenStagesManager(project)}
                          className="flex items-center gap-1 rounded border border-[#0086ff] px-3 py-1.5 text-[#0086ff] hover:bg-blue-50 transition-colors font-medium text-xs"
                        >
                          <Layers className="h-3.5 w-3.5" /> Quản lý Chặng
                        </button>
                        <button onClick={() => handleOpenProjectModal(project)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteProject(project.id)} className="rounded p-1.5 text-red-400 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: THÊM / SỬA PROJECT
          ========================================================================= */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsProjectModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold">{projectForm.id ? 'Sửa Dự án' : 'Thêm Dự án mới'}</h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProject} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Tên dự án (title)</label>
                <input 
                  type="text" 
                  required 
                  value={projectForm.title || ''} 
                  onChange={e => setProjectForm({...projectForm, title: e.target.value})} 
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0086ff] focus:outline-none" 
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Mô tả (description)</label>
                <textarea 
                  rows={2} 
                  value={projectForm.description || ''} 
                  onChange={e => setProjectForm({...projectForm, description: e.target.value})} 
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0086ff] focus:outline-none resize-none" 
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-semibold">Ngày bắt đầu</label>
                  <input 
                    type="date" 
                    required 
                    value={projectForm.start_date || ''} 
                    onChange={e => setProjectForm({...projectForm, start_date: e.target.value})} 
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0086ff] focus:outline-none" 
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-semibold">Ngày kết thúc</label>
                  <input 
                    type="date" 
                    required 
                    value={projectForm.end_date || ''} 
                    onChange={e => setProjectForm({...projectForm, end_date: e.target.value})} 
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[#0086ff] focus:outline-none" 
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={projectForm.is_active ?? true} 
                  onChange={e => setProjectForm({...projectForm, is_active: e.target.checked})} 
                  className="h-4 w-4 rounded border-gray-300 text-[#0086ff] focus:ring-[#0086ff]" 
                />
                <label htmlFor="isActive" className="text-sm font-semibold">Kích hoạt dự án (is_active)</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-[#0086ff] rounded-lg">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: QUẢN LÝ STAGES (Thuộc về 1 Project)
          ========================================================================= */}
      {activeProjectForStages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActiveProjectForStages(null)} />
          <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Quản lý Chặng (Stages)</h3>
                <p className="text-sm text-[#0086ff] font-medium">Dự án: {activeProjectForStages.title}</p>
              </div>
              <button onClick={() => setActiveProjectForStages(null)} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              
              {/* CỘT TRÁI: DANH SÁCH CÁC CHẶNG */}
              <div className="w-3/5 border-r border-gray-100 overflow-y-auto p-4 bg-white">
                <h4 className="text-sm font-bold text-gray-700 mb-3">Danh sách chặng hiện tại</h4>
                <div className="space-y-3">
                  {stages.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có chặng nào trong dự án này.</p>}
                  {stages.map(stage => (
                    <div key={stage.id} className="flex items-center gap-3 border rounded-lg p-3 hover:border-blue-300 bg-white shadow-sm">
                      <div className="h-10 w-12 bg-gray-50 border rounded flex items-center justify-center shrink-0 relative overflow-hidden">
                        {stage.stamp_image_url ? (
                          <Image src={stage.stamp_image_url} alt="stamp" fill className="object-contain p-1"/>
                        ) : (
                          <span className="text-[9px]">Trống</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-500">Order: {stage.stage_order}</p>
                        <p className="text-sm font-bold text-gray-900">{stage.stage_name}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditStage(stage)} className="p-1.5 text-gray-400 hover:text-[#0086ff] bg-gray-50 rounded">
                          <Pencil className="h-3.5 w-3.5"/>
                        </button>
                        <button onClick={() => handleDeleteStage(stage.id)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-50 rounded">
                          <Trash2 className="h-3.5 w-3.5"/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CỘT PHẢI: FORM THÊM / SỬA STAGE */}
              <div className="w-2/5 p-6 bg-gray-50/50 overflow-y-auto">
                <h4 className="text-sm font-bold text-gray-700 mb-4">{isEditingStage ? 'Sửa thông tin chặng' : 'Thêm chặng mới'}</h4>
                <form onSubmit={handleSaveStage} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Thứ tự (stage_order)</label>
                    <input 
                      type="number" 
                      required 
                      min="1" 
                      value={stageForm.stage_order || ''} 
                      onChange={e => setStageForm({...stageForm, stage_order: Number(e.target.value)})} 
                      className="w-full rounded-md border px-3 py-2 text-sm focus:border-[#0086ff] focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Tên chặng (stage_name)</label>
                    <input 
                      type="text" 
                      required 
                      value={stageForm.stage_name || ''} 
                      onChange={e => setStageForm({...stageForm, stage_name: e.target.value})} 
                      className="w-full rounded-md border px-3 py-2 text-sm focus:border-[#0086ff] focus:outline-none" 
                    />
                  </div>
                  
                  {/* PHẦN CHỌN FILE ẢNH STAMP */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Hình ảnh Stamp
                    </label>
                    <div className="flex flex-col gap-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleStampUpload}
                        disabled={isUploadingStamp}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100 disabled:opacity-50 cursor-pointer border rounded-md p-1"
                      />
                      
                      {isUploadingStamp && (
                        <span className="text-xs text-blue-500 animate-pulse">Đang tải ảnh lên máy chủ...</span>
                      )}

                      {stageForm.stamp_image_url && !isUploadingStamp && (
                        <div className="mt-2 relative h-20 w-20 rounded border bg-gray-50 overflow-hidden shadow-sm">
                          <Image 
                            src={stageForm.stamp_image_url} 
                            alt="Preview Stamp" 
                            fill
                            className="object-contain p-1" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 flex gap-2">
                    {isEditingStage && (
                      <button 
                        type="button" 
                        onClick={() => { 
                          setIsEditingStage(false); 
                          setStageForm({ project_id: activeProjectForStages.id, stage_order: stages.length + 1, stage_name: '', stamp_image_url: '' }); 
                        }} 
                        className="flex-1 py-2 text-sm font-semibold border rounded-lg bg-white text-gray-600"
                      >
                        Hủy sửa
                      </button>
                    )}
                    <button type="submit" className="flex-1 py-2 text-sm font-semibold bg-[#0086ff] text-white rounded-lg hover:bg-blue-600">
                      {isEditingStage ? 'Lưu chặng' : 'Thêm chặng'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}