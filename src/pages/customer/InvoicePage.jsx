import { useParams } from "react-router";
import { Download, Printer, Check } from "lucide-react";
function InvoicePage() {
  const { orderId } = useParams();
  const invoice = {
    id: orderId || "INV-2024-001",
    orderNumber: "ORD-2024-001",
    date: "15/03/2024",
    dueDate: "22/03/2024",
    status: "\u0110\xE3 thanh to\xE1n",
    customer: {
      name: "Nguy\u1EC5n V\u0103n A",
      email: "nguyenvana@email.com",
      phone: "0901234567",
      address: "123 \u0110\u01B0\u1EDDng ABC, Qu\u1EADn 1, TP.HCM"
    },
    items: [
      {
        id: "1",
        name: "G\u1ECDng Ch\u1EEF Nh\u1EADt C\u1ED5 \u0110i\u1EC3n",
        description: "M\xE0u \u0111en, acetate cao c\u1EA5p",
        quantity: 1,
        price: 79
      },
      {
        id: "2",
        name: "Tr\xF2ng k\xEDnh cao c\u1EA5p 1.67",
        description: "Ch\u1ED1ng \xE1nh s\xE1ng xanh, ch\u1ED1ng ph\u1EA3n quang",
        quantity: 1,
        price: 79
      }
    ],
    subtotal: 158,
    tax: 15.8,
    shipping: 0,
    total: 173.8
  };
  const handlePrint = () => {
    window.print();
  };
  const handleDownload = () => {
    alert("T\u1EA3i xu\u1ED1ng h\xF3a \u0111\u01A1n PDF");
  };
  return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white border-2 border-border rounded-lg overflow-hidden print:border-0">
        <div className="p-8 border-b border-border bg-secondary/30 print:bg-white">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="mb-2">Hóa Đơn</h1>
              <p className="text-sm text-muted-foreground">#{invoice.id}</p>
            </div>
            <div className="flex gap-2 print:hidden">
              <button
    onClick={handlePrint}
    className="p-2 border border-border rounded hover:bg-secondary transition-colors"
  >
                <Printer className="w-5 h-5" />
              </button>
              <button
    onClick={handleDownload}
    className="p-2 border border-border rounded hover:bg-secondary transition-colors"
  >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Từ:</p>
              <p className="mb-1">VisionDirect</p>
              <p className="text-sm text-muted-foreground">456 Đường XYZ</p>
              <p className="text-sm text-muted-foreground">Quận 3, TP.HCM</p>
              <p className="text-sm text-muted-foreground">contact@visiondirect.com</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Đến:</p>
              <p className="mb-1">{invoice.customer.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.customer.address}</p>
              <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
              <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>
            </div>
          </div>
        </div>

        <div className="p-8 border-b border-border">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Số đơn hàng</p>
              <p>{invoice.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ngày hóa đơn</p>
              <p>{invoice.date}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-800">{invoice.status}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm text-muted-foreground">Sản phẩm</th>
                  <th className="pb-3 text-center text-sm text-muted-foreground">
                    Số lượng
                  </th>
                  <th className="pb-3 text-right text-sm text-muted-foreground">Đơn giá</th>
                  <th className="pb-3 text-right text-sm text-muted-foreground">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.items.map((item) => <tr key={item.id}>
                    <td className="py-4">
                      <p className="mb-1">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </td>
                    <td className="py-4 text-center">{item.quantity}</td>
                    <td className="py-4 text-right">${item.price.toFixed(2)}</td>
                    <td className="py-4 text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-8">
          <div className="max-w-sm ml-auto space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Thuế (10%)</span>
              <span>${invoice.tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Vận chuyển</span>
              <span className="text-accent">Miễn phí</span>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-lg">Tổng cộng</span>
              <span className="text-2xl text-primary">${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-8 bg-secondary/30 border-t border-border print:bg-white">
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Lưu ý:</strong>
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Hóa đơn này được tạo tự động từ hệ thống</li>
            <li>Vui lòng giữ hóa đơn để đổi trả hàng (nếu cần)</li>
            <li>Liên hệ: contact@visiondirect.com hoặc 1900-xxxx</li>
          </ul>
        </div>
      </div>
    </div>;
}
export {
  InvoicePage as default
};
