"use client";

import { useRef, useCallback } from "react";
import { useEditor, EditorContent, Editor, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { uploadFileToR2 } from "@/lib/uploadR2Client";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Minus,
  Loader2,
} from "lucide-react";
import { useState } from "react";

// ==========================================================
// TOOLBAR BUTTON
// ==========================================================
function ToolbarBtn({
  onClick,
  active,
  title,
  disabled,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors
        ${
          active
            ? "bg-[#FF76C3] text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }
        ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-gray-200" />;
}

// ==========================================================
// TOOLBAR
// ==========================================================
function EditorToolbar({
  editor,
  onUploadImage,
  isUploading,
}: {
  editor: Editor;
  onUploadImage: () => void;
  isUploading: boolean;
}) {
  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Nhập URL liên kết:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 px-2 py-1.5">
      {/* Undo / Redo */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Hoàn tác"
      >
        <Undo size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Làm lại"
      >
        <Redo size={15} />
      </ToolbarBtn>

      <Divider />

      {/* Headings */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Tiêu đề H1"
      >
        <Heading1 size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Tiêu đề H2"
      >
        <Heading2 size={15} />
      </ToolbarBtn>

      {/* Font Size Input */}
      <div className="mx-1 flex h-8 items-center gap-1 rounded border border-gray-300 bg-white px-1 focus-within:border-[#FF76C3]" title="Cỡ chữ tùy chỉnh">
        <input
          list="font-sizes"
          className="w-[3.5rem] text-center text-sm text-gray-700 outline-none"
          placeholder="Mặc định"
          value={editor.getAttributes("textStyle").fontSize?.replace("px", "") || ""}
          onChange={(e) => {
            const size = e.target.value;
            if (size && !isNaN(Number(size))) {
              // @ts-ignore
              editor.chain().setFontSize(`${size}px`).run();
            } else if (size === "") {
              // @ts-ignore
              editor.chain().unsetFontSize().run();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              editor.commands.focus();
            }
          }}
        />
        <span className="select-none text-xs text-gray-400">px</span>
        <datalist id="font-sizes">
          <option value="12" />
          <option value="14" />
          <option value="16" />
          <option value="18" />
          <option value="20" />
          <option value="24" />
          <option value="30" />
          <option value="36" />
          <option value="48" />
          <option value="60" />
        </datalist>
      </div>

      {/* Line Height Selector */}
      <select
        className="mx-1 h-8 rounded border border-gray-300 bg-white px-1 text-sm text-gray-700 outline-none hover:bg-gray-50 focus:border-[#FF76C3]"
        onChange={(e) => {
          const lh = e.target.value;
          if (lh) {
            // @ts-ignore
            editor.chain().focus().setLineHeight(lh).run();
          } else {
            // @ts-ignore
            editor.chain().focus().unsetLineHeight().run();
          }
        }}
        value={editor.getAttributes("paragraph").lineHeight || editor.getAttributes("heading").lineHeight || ""}
        title="Giãn dòng"
      >
        <option value="">Giãn dòng mặc định</option>
        <option value="1">1.0 - Gần</option>
        <option value="1.15">1.15</option>
        <option value="1.5">1.5 - Rộng</option>
        <option value="2">2.0 - Rất rộng</option>
        <option value="2.5">2.5</option>
        <option value="3">3.0</option>
      </select>

      <Divider />

      {/* Text format */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="In đậm"
      >
        <Bold size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="In nghiêng"
      >
        <Italic size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Gạch chân"
      >
        <UnderlineIcon size={15} />
      </ToolbarBtn>

      <Divider />

      {/* Align */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        title="Căn trái"
      >
        <AlignLeft size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        title="Căn giữa"
      >
        <AlignCenter size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        title="Căn phải"
      >
        <AlignRight size={15} />
      </ToolbarBtn>

      <Divider />

      {/* Lists */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Danh sách gạch đầu dòng"
      >
        <List size={15} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Danh sách đánh số"
      >
        <ListOrdered size={15} />
      </ToolbarBtn>

      <Divider />

      {/* Horizontal rule */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Đường kẻ ngang"
      >
        <Minus size={15} />
      </ToolbarBtn>

      {/* Link */}
      <ToolbarBtn
        onClick={setLink}
        active={editor.isActive("link")}
        title="Chèn liên kết"
      >
        <LinkIcon size={15} />
      </ToolbarBtn>

      {/* Image upload */}
      <ToolbarBtn
        onClick={onUploadImage}
        disabled={isUploading}
        title="Chèn ảnh vào bài viết"
      >
        {isUploading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <ImageIcon size={15} />
        )}
      </ToolbarBtn>
    </div>
  );
}

// ==========================================================
// CUSTOM FONT SIZE EXTENSION
// ==========================================================
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

// ==========================================================
// CUSTOM LINE HEIGHT EXTENSION
// ==========================================================
const LineHeight = Extension.create({
  name: "lineHeight",
  addOptions() {
    return {
      types: ["paragraph", "heading"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }) => {
          return this.options.types.every((type) => commands.updateAttributes(type, { lineHeight }));
        },
      unsetLineHeight:
        () =>
        ({ commands }) => {
          return this.options.types.every((type) => commands.resetAttributes(type, "lineHeight"));
        },
    };
  },
});

// ==========================================================
// CUSTOM IMAGE EXTENSION
// ==========================================================
const ImageNodeView = ({ node, updateAttributes, selected }: any) => {
  const { src, alt, width, float } = node.attrs;
  const imgRef = useRef<HTMLImageElement>(null);

  // Xử lý kéo để thay đổi kích thước
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = imgRef.current?.offsetWidth || 0;
    // Tìm phần tử cha chứa editor để tính % chuẩn xác
    const parentEl = imgRef.current?.closest(".tiptap") as HTMLElement;
    const parentWidth = parentEl?.offsetWidth || 800;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Nếu ảnh float right, kéo chuột sang trái sẽ làm tăng kích thước (vì kéo cạnh trái/phải đều như nhau, ta đang resize từ góc phải dưới)
      // Tùy theo vị trí float mà điều chỉnh:
      let dx = moveEvent.clientX - startX;
      if (float === "right") dx = -dx; // Kéo sang trái làm to ảnh khi ở bên phải
      
      const newWidthPx = Math.max(50, startWidth + dx);
      let newWidthPct = Math.round((newWidthPx / parentWidth) * 100);
      if (newWidthPct > 100) newWidthPct = 100;
      updateAttributes({ width: `${newWidthPct}%` });
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <NodeViewWrapper
      style={{
        float: float !== "none" ? float : undefined,
        width: width,
        display: float === "none" ? "block" : "inline-block",
        margin: float === "none" ? "1rem auto" : `0 ${float === "left" ? "1.5rem" : "0"} 1rem ${float === "right" ? "1.5rem" : "0"}`,
      }}
      className={`relative group ${selected ? "outline outline-3 outline-[#FF76C3] outline-offset-2 rounded-lg" : ""}`}
    >
      <img ref={imgRef} src={src} alt={alt} className="w-full h-auto rounded-lg block" />
      
      {/* Nút kéo để thay đổi kích thước (Resize Handle) */}
      {selected && (
        <div 
          onMouseDown={handleResizeMouseDown}
          className={`absolute -bottom-2 ${float === "right" ? "-left-2 cursor-sw-resize" : "-right-2 cursor-se-resize"} w-4 h-4 bg-[#FF76C3] rounded-full border-2 border-white shadow-md z-50 hover:scale-125 transition-transform`}
          title="Kéo để thay đổi kích thước"
        />
      )}
      
      {/* Control overlay */}
      {selected && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white p-1.5 rounded-md shadow-lg border border-gray-200 z-50 whitespace-nowrap">
          <span className="text-xs font-bold text-gray-500 w-[3ch] text-center px-1">{width}</span>
          <div className="w-px h-5 bg-gray-300 mx-1"></div>

          <button type="button" onClick={() => updateAttributes({ width: "50%" })} className={`px-2 py-1 text-xs font-semibold rounded hover:bg-gray-100 ${width === "50%" ? "bg-gray-100 text-[#FF76C3]" : "text-gray-600"}`}>50%</button>
          <button type="button" onClick={() => updateAttributes({ width: "100%" })} className={`px-2 py-1 text-xs font-semibold rounded hover:bg-gray-100 ${width === "100%" ? "bg-gray-100 text-[#FF76C3]" : "text-gray-600"}`}>100%</button>
          
          <div className="w-px h-5 bg-gray-300 mx-1"></div>
          
          <button type="button" onClick={() => updateAttributes({ float: "left" })} className={`p-1.5 rounded hover:bg-gray-100 ${float === "left" ? "bg-gray-100 text-[#FF76C3]" : "text-gray-600"}`} title="Trái (Wrap text)">
            <AlignLeft size={16} />
          </button>
          <button type="button" onClick={() => updateAttributes({ float: "none" })} className={`p-1.5 rounded hover:bg-gray-100 ${float === "none" ? "bg-gray-100 text-[#FF76C3]" : "text-gray-600"}`} title="Giữa (Không wrap)">
            <AlignCenter size={16} />
          </button>
          <button type="button" onClick={() => updateAttributes({ float: "right" })} className={`p-1.5 rounded hover:bg-gray-100 ${float === "right" ? "bg-gray-100 text-[#FF76C3]" : "text-gray-600"}`} title="Phải (Wrap text)">
            <AlignRight size={16} />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
};

const CustomImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        renderHTML: (attributes) => ({
          width: attributes.width,
        }),
      },
      float: {
        default: "none",
        renderHTML: (attributes) => {
          if (attributes.float === "none") {
            return {
              style: "display: block; margin-left: auto; margin-right: auto;",
            };
          }
          return {
            style: `float: ${attributes.float}; margin-${attributes.float === "left" ? "right" : "left"}: 1.5rem; margin-bottom: 1rem;`,
          };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

// ==========================================================
// MAIN COMPONENT
// ==========================================================
interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Bắt đầu soạn nội dung bài viết...",
}: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontSize,
      LineHeight,
      CustomImage.configure({
        inline: false,
        allowBase64: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#FF76C3] underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[300px] px-4 py-3 focus:outline-none text-gray-800",
      },
    },
  });

  // Upload ảnh lên Cloudflare R2 (qua API Route) và chèn vào editor
  const handleImageFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      setIsUploading(true);
      try {
        // folder "editor-images" trên R2 bucket
        const publicUrl = await uploadFileToR2(file, "editor-images");
        editor.chain().focus().setImage({ src: publicUrl }).run();
      } catch (err) {
        console.error("Upload ảnh thất bại:", err);
        alert("Không thể tải ảnh lên. Vui lòng thử lại!");
      } finally {
        setIsUploading(false);
        // Reset input để có thể chọn lại cùng file
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-gray-200 shadow-sm">
      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        onUploadImage={() => imageInputRef.current?.click()}
        isUploading={isUploading}
      />

      {/* Editor body */}
      <div className="rounded-b-lg border border-gray-200 bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
