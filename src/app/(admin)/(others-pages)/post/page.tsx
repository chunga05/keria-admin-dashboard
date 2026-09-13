import { redirect } from "next/navigation";

// /post -> redirect sang /post/create (trang quản lý bài viết chính)
export default function PostPage() {
  redirect("/post/create");
}
