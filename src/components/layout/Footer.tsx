import { Link } from "react-router";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import Logo from "@/components/layout/Logo";

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <Logo className="mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Kính mắt cao cấp với thiết kế hiện đại và công nghệ tròng kính tiên tiến.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Liên Kết Nhanh</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/shop" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Sản Phẩm
                </Link>
              </li>
              <li>
                <Link to="/shop/prescription" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Kính Cận
                </Link>
              </li>
              <li>
                <Link to="/shop/sunglasses" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Kính Râm
                </Link>
              </li>
              <li>
                <Link to="/shop/premium" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Thương Hiệu Cao Cấp
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">Hỗ Trợ Khách Hàng</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Về Chúng Tôi
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Liên Hệ
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Câu Hỏi Thường Gặp
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Chính Sách Vận Chuyển
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Đổi Trả & Hoàn Tiền
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Liên Hệ</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">
                  123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a href="tel:+84123456789" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  +84 123 456 789
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:info@visiondirect.vn" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  info@visiondirect.vn
                </a>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Giờ làm việc:</p>
              <p className="text-sm text-foreground">Thứ 2 - Thứ 7: 9:00 - 21:00</p>
              <p className="text-sm text-foreground">Chủ Nhật: 10:00 - 18:00</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 VisionDirect. Bảo lưu mọi quyền.
            </p>
            <div className="flex gap-6">
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Điều Khoản Dịch Vụ
              </Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Chính Sách Bảo Mật
              </Link>
              <Link to="/cookies" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Chính Sách Cookie
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
