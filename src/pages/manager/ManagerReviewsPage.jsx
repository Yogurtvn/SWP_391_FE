import { useState } from "react";
import { Star, Check, X, Search } from "lucide-react";
function ManagerReviewsPage() {
  const [reviews, setReviews] = useState([
    {
      id: "REV-001",
      productName: "G\u1ECDng Ch\u1EEF Nh\u1EADt C\u1ED5 \u0110i\u1EC3n",
      productImage: "https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=200",
      customerName: "Nguy\u1EC5n V\u0103n A",
      rating: 5,
      comment: "S\u1EA3n ph\u1EA9m r\u1EA5t t\u1ED1t, ch\u1EA5t l\u01B0\u1EE3ng cao. \u0110eo r\u1EA5t tho\u1EA3i m\xE1i.",
      createdAt: "2024-03-15T10:30:00",
      status: "pending"
    },
    {
      id: "REV-002",
      productName: "M\u1EAFt M\xE8o Hi\u1EC7n \u0110\u1EA1i",
      productImage: "https://images.unsplash.com/photo-1654274285614-37cad6007665?w=200",
      customerName: "Tr\u1EA7n Th\u1ECB B",
      rating: 4,
      comment: "\u0110\u1EB9p nh\u01B0ng h\u01A1i ch\u1EADt. C\u1EA7n size l\u1EDBn h\u01A1n m\u1ED9t ch\xFAt.",
      createdAt: "2024-03-14T14:20:00",
      status: "pending"
    },
    {
      id: "REV-003",
      productName: "Aviator Sunglasses",
      productImage: "https://images.unsplash.com/photo-1681147768015-c6d3702f5e4f?w=200",
      customerName: "L\xEA V\u0103n C",
      rating: 5,
      comment: "K\xEDnh r\xE2m \u0111\u1EB9p, ch\u1EA5t l\u01B0\u1EE3ng tuy\u1EC7t v\u1EDDi!",
      createdAt: "2024-03-13T09:15:00",
      status: "approved"
    }
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReview, setSelectedReview] = useState(null);
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = review.productName.toLowerCase().includes(searchQuery.toLowerCase()) || review.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || review.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  const handleApprove = (reviewId) => {
    setReviews(
      reviews.map(
        (review) => review.id === reviewId ? { ...review, status: "approved" } : review
      )
    );
    setSelectedReview(null);
  };
  const handleReject = (reviewId) => {
    if (confirm("B\u1EA1n c\xF3 ch\u1EAFc mu\u1ED1n t\u1EEB ch\u1ED1i \u0111\xE1nh gi\xE1 n\xE0y?")) {
      setReviews(
        reviews.map(
          (review) => review.id === reviewId ? { ...review, status: "rejected" } : review
        )
      );
      setSelectedReview(null);
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Ch\u1EDD duy\u1EC7t";
      case "approved":
        return "\u0110\xE3 duy\u1EC7t";
      case "rejected":
        return "\u0110\xE3 t\u1EEB ch\u1ED1i";
      default:
        return status;
    }
  };
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="mb-2">Quản Lý Đánh Giá</h1>
        <p className="text-muted-foreground">
          Duyệt đánh giá từ khách hàng ({pendingCount} đang chờ)
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
    type="text"
    placeholder="Tìm kiếm theo tên sản phẩm hoặc khách hàng..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary"
  />
        </div>

        <div className="flex gap-4">
          <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary"
  >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {filteredReviews.map((review) => <button
    key={review.id}
    onClick={() => setSelectedReview(review)}
    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${selectedReview?.id === review.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
  >
              <div className="flex items-start gap-3 mb-2">
                <img
    src={review.productImage}
    alt={review.productName}
    className="w-12 h-12 object-cover rounded"
  />
                <div className="flex-1 min-w-0">
                  <p className="text-sm mb-1 truncate">{review.productName}</p>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => <Star
    key={i}
    className={`w-3 h-3 ${i < review.rating ? "fill-primary text-primary" : "text-gray-300"}`}
  />)}
                  </div>
                  <p className="text-xs text-muted-foreground">{review.customerName}</p>
                </div>
              </div>
              <div
    className={`text-xs px-2 py-1 rounded border inline-block ${getStatusColor(
      review.status
    )}`}
  >
                {getStatusLabel(review.status)}
              </div>
            </button>)}
        </div>

        <div className="lg:col-span-2">
          {selectedReview ? <div className="bg-white border-2 border-border rounded-lg overflow-hidden">
              <div className="p-6 border-b border-border bg-secondary/30">
                <div className="flex items-start gap-4 mb-4">
                  <img
    src={selectedReview.productImage}
    alt={selectedReview.productName}
    className="w-20 h-20 object-cover rounded-lg"
  />
                  <div className="flex-1">
                    <h3 className="mb-2">{selectedReview.productName}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => <Star
    key={i}
    className={`w-4 h-4 ${i < selectedReview.rating ? "fill-primary text-primary" : "text-gray-300"}`}
  />)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({selectedReview.rating}/5)
                      </span>
                    </div>
                    <div
    className={`text-sm px-3 py-1.5 rounded border inline-block ${getStatusColor(
      selectedReview.status
    )}`}
  >
                      {getStatusLabel(selectedReview.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-b border-border">
                <h3 className="mb-3">Thông tin khách hàng</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Tên:</span>{" "}
                    {selectedReview.customerName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Ngày đánh giá:</span>{" "}
                    {new Date(selectedReview.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              <div className="p-6 border-b border-border">
                <h3 className="mb-3">Nội dung đánh giá</h3>
                <p className="text-foreground/80 leading-relaxed">
                  {selectedReview.comment}
                </p>
              </div>

              {selectedReview.status === "pending" && <div className="p-6 bg-secondary/30">
                  <h3 className="mb-4">Thao tác</h3>
                  <div className="flex gap-3">
                    <button
    onClick={() => handleApprove(selectedReview.id)}
    className="flex-1 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
  >
                      <Check className="w-4 h-4" />
                      Duyệt đánh giá
                    </button>
                    <button
    onClick={() => handleReject(selectedReview.id)}
    className="flex-1 py-2 border border-destructive text-destructive rounded hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
  >
                      <X className="w-4 h-4" />
                      Từ chối
                    </button>
                  </div>
                </div>}

              {selectedReview.status !== "pending" && <div className="p-6 bg-secondary/30">
                  <p className="text-sm text-muted-foreground text-center">
                    Đánh giá này đã được xử lý
                  </p>
                </div>}
            </div> : <div className="bg-secondary rounded-lg p-12 text-center">
              <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Chọn một đánh giá để xem chi tiết
              </p>
            </div>}
        </div>
      </div>
    </div>;
}
export {
  ManagerReviewsPage as default
};
