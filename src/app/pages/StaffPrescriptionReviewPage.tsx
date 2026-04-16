import { useState } from "react";
import { Eye, Check, X, Search, FileText, Image as ImageIcon } from "lucide-react";

interface PrescriptionReview {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  frameName: string;
  framePrice: number;
  prescriptionData: {
    odSph: string;
    odCyl: string;
    odAxis: string;
    osSph: string;
    osCyl: string;
    osAxis: string;
    pd: string;
    add?: string;
  };
  lensType: string;
  lensPrice: number;
  totalPrice: number;
  prescriptionImage?: string;
  notes?: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  priority: "high" | "normal" | "low";
}

export default function StaffPrescriptionReviewPage() {
  const [reviews, setReviews] = useState<PrescriptionReview[]>([
    {
      id: "PRE-001",
      orderNumber: "ORD-2024-001",
      customerName: "Nguyễn Văn A",
      customerEmail: "nguyenvana@email.com",
      frameName: "Gọng Titan Chữ Nhật",
      framePrice: 1890000,
      prescriptionData: {
        odSph: "-2.50",
        odCyl: "-0.75",
        odAxis: "90",
        osSph: "-2.25",
        osCyl: "-0.50",
        osAxis: "85",
        pd: "63",
      },
      lensType: "Tròng kính cận cao cấp (chống ánh sáng xanh)",
      lensPrice: 980000,
      totalPrice: 2870000,
      prescriptionImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
      notes: "Khách hàng yêu cầu làm nhanh trong 48h",
      createdAt: "2024-01-16T14:30:00",
      status: "pending",
      priority: "high",
    },
    {
      id: "PRE-002",
      orderNumber: "ORD-2024-005",
      customerName: "Hoàng Văn E",
      customerEmail: "hoangvane@email.com",
      frameName: "Gọng Mắt Mèo Acetate",
      framePrice: 2100000,
      prescriptionData: {
        odSph: "-1.25",
        odCyl: "",
        odAxis: "",
        osSph: "-1.50",
        osCyl: "",
        osAxis: "",
        pd: "62",
      },
      lensType: "Tròng kính cận tiêu chuẩn",
      lensPrice: 650000,
      totalPrice: 2750000,
      createdAt: "2024-01-16T09:20:00",
      status: "pending",
      priority: "normal",
    },
    {
      id: "PRE-003",
      orderNumber: "ORD-2024-008",
      customerName: "Trần Thị B",
      customerEmail: "tranthib@email.com",
      frameName: "Gọng Oval Kim Loại",
      framePrice: 1450000,
      prescriptionData: {
        odSph: "+1.50",
        odCyl: "+0.50",
        odAxis: "180",
        osSph: "+1.75",
        osCyl: "+0.25",
        osAxis: "175",
        pd: "64",
        add: "+2.00",
      },
      lensType: "Tròng kính đa tròng (Progressive)",
      lensPrice: 1850000,
      totalPrice: 3300000,
      prescriptionImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400",
      notes: "Kính đa tròng cho người lớn tuổi",
      createdAt: "2024-01-15T16:45:00",
      status: "approved",
      priority: "normal",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedReview, setSelectedReview] = useState<PrescriptionReview | null>(null);

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || review.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (reviewId: string) => {
    setReviews(
      reviews.map((review) =>
        review.id === reviewId ? { ...review, status: "approved" as const } : review
      )
    );
    setSelectedReview(null);
  };

  const handleReject = (reviewId: string) => {
    const reason = prompt("Lý do từ chối (sẽ được gửi cho khách hàng):");
    if (reason) {
      setReviews(
        reviews.map((review) =>
          review.id === reviewId ? { ...review, status: "rejected" as const } : review
        )
      );
      alert(`Đã từ chối đơn với lý do: ${reason}`);
      setSelectedReview(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ kiểm tra";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Đã từ chối";
      default:
        return status;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <span className="px-2 py-1 bg-red-50 text-red-700 border-2 border-red-200 rounded-lg text-xs font-bold">
            ⚠️ Khẩn
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-1 bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-lg text-xs font-bold">
            Thấp
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-lg text-xs font-bold">
            Bình thường
          </span>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border-2 border-blue-300 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center border-2 border-blue-300">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kiểm Tra Đơn Kính</h1>
              <p className="text-gray-600 font-medium">
                <span className="font-bold text-blue-600">{pendingCount}</span> đơn đang chờ kiểm tra
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl border-2 border-blue-300 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hoặc tên khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ kiểm tra</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {filteredReviews.map((review) => (
              <button
                key={review.id}
                onClick={() => setSelectedReview(review)}
                className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                  selectedReview?.id === review.id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-blue-200 bg-white hover:border-blue-400 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{review.orderNumber}</p>
                    <p className="text-xs text-gray-600 font-medium">{review.customerName}</p>
                  </div>
                  <div className="text-right">
                    {getPriorityBadge(review.priority)}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">Gọng kính:</p>
                  <p className="text-sm font-bold text-gray-900">{review.frameName}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div
                    className={`text-xs px-3 py-1 rounded-lg border-2 font-bold ${getStatusColor(
                      review.status
                    )}`}
                  >
                    {getStatusLabel(review.status)}
                  </div>
                  {review.prescriptionImage && (
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      Có ảnh
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {selectedReview ? (
              <div className="bg-white border-2 border-blue-300 rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-6 border-b-2 border-blue-300 bg-blue-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl mb-2 font-bold text-gray-900">{selectedReview.orderNumber}</h2>
                      <p className="text-sm text-gray-600 font-medium">
                        Khách hàng: <span className="font-bold text-gray-900">{selectedReview.customerName}</span>
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Email: {selectedReview.customerEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm px-4 py-2 rounded-xl border-2 font-bold mb-2 ${getStatusColor(
                          selectedReview.status
                        )}`}
                      >
                        {getStatusLabel(selectedReview.status)}
                      </div>
                      {getPriorityBadge(selectedReview.priority)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    Ngày tạo: {new Date(selectedReview.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>

                {/* Prescription Data */}
                <div className="p-6 border-b-2 border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Thông Tin Đơn Kính
                  </h3>
                  <div className="bg-blue-50 p-5 rounded-xl space-y-4 text-sm border-2 border-blue-200">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-blue-700 mb-3 font-bold text-base">Mắt Phải (OD)</p>
                        <div className="space-y-2">
                          <p className="font-medium text-gray-900">
                            <span className="text-gray-600">SPH:</span>{" "}
                            <span className="font-mono font-bold">{selectedReview.prescriptionData.odSph}</span>
                          </p>
                          <p className="font-medium text-gray-900">
                            <span className="text-gray-600">CYL:</span>{" "}
                            <span className="font-mono font-bold">{selectedReview.prescriptionData.odCyl || "—"}</span>
                          </p>
                          <p className="font-medium text-gray-900">
                            <span className="text-gray-600">AXIS:</span>{" "}
                            <span className="font-mono font-bold">{selectedReview.prescriptionData.odAxis || "—"}</span>
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-blue-700 mb-3 font-bold text-base">Mắt Trái (OS)</p>
                        <div className="space-y-2">
                          <p className="font-medium text-gray-900">
                            <span className="text-gray-600">SPH:</span>{" "}
                            <span className="font-mono font-bold">{selectedReview.prescriptionData.osSph}</span>
                          </p>
                          <p className="font-medium text-gray-900">
                            <span className="text-gray-600">CYL:</span>{" "}
                            <span className="font-mono font-bold">{selectedReview.prescriptionData.osCyl || "—"}</span>
                          </p>
                          <p className="font-medium text-gray-900">
                            <span className="text-gray-600">AXIS:</span>{" "}
                            <span className="font-mono font-bold">{selectedReview.prescriptionData.osAxis || "—"}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border-t-2 border-blue-300 pt-4">
                      <p className="font-bold text-gray-900">
                        Khoảng Cách Đồng Tử (PD):{" "}
                        <span className="font-mono text-blue-700">{selectedReview.prescriptionData.pd} mm</span>
                      </p>
                      {selectedReview.prescriptionData.add && (
                        <p className="font-bold text-gray-900 mt-2">
                          ADD (Đa tròng):{" "}
                          <span className="font-mono text-blue-700">{selectedReview.prescriptionData.add}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-6 border-b-2 border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Chi Tiết Sản Phẩm</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 font-bold">Gọng kính:</p>
                      <p className="font-bold text-gray-900">{selectedReview.frameName}</p>
                      <p className="text-sm text-blue-600 font-bold mt-1">
                        {formatCurrency(selectedReview.framePrice)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 font-bold">Loại tròng:</p>
                      <p className="font-bold text-gray-900">{selectedReview.lensType}</p>
                      <p className="text-sm text-blue-600 font-bold mt-1">
                        {formatCurrency(selectedReview.lensPrice)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">Tổng cộng:</span>
                        <span className="text-xl text-blue-600 font-bold">
                          {formatCurrency(selectedReview.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prescription Image */}
                {selectedReview.prescriptionImage && (
                  <div className="p-6 border-b-2 border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                      Ảnh Đơn Thuốc
                    </h3>
                    <img
                      src={selectedReview.prescriptionImage}
                      alt="Prescription"
                      className="w-full rounded-xl border-2 border-gray-300"
                    />
                  </div>
                )}

                {/* Notes */}
                {selectedReview.notes && (
                  <div className="p-6 border-b-2 border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Ghi chú</h3>
                    <p className="text-gray-700 bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200 font-medium">
                      {selectedReview.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {selectedReview.status === "pending" && (
                  <div className="p-6 bg-blue-50">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(selectedReview.id)}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-bold text-lg border-2 border-green-700"
                      >
                        <Check className="w-5 h-5" />
                        Duyệt Đơn Kính
                      </button>
                      <button
                        onClick={() => handleReject(selectedReview.id)}
                        className="flex-1 py-3 border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-bold text-lg"
                      >
                        <X className="w-5 h-5" />
                        Từ Chối
                      </button>
                    </div>
                  </div>
                )}

                {selectedReview.status !== "pending" && (
                  <div className="p-6 bg-gray-50">
                    <p className="text-sm text-gray-600 text-center font-medium">
                      ✓ Đơn kính này đã được xử lý
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-blue-200 p-12 text-center">
                <Eye className="w-20 h-20 text-blue-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium text-lg">
                  Chọn một đơn kính để kiểm tra chi tiết
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
