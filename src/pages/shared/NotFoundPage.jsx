import { Link } from "react-router";
import { Home } from "lucide-react";
function NotFoundPage() {
  return <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl mb-4">404</h1>
        <h2 className="mb-4">Không Tìm Thấy Trang</h2>
        <p className="text-muted-foreground mb-8">
          Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.
        </p>
        <Link
    to="/"
    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
  >
          <Home className="w-5 h-5" />
          Về Trang Chủ
        </Link>
      </div>
    </div>;
}
export {
  NotFoundPage as default
};
