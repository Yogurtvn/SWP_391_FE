import { useAdminLensPackagesPage } from "@/hooks/admin/useAdminLensPackagesPage";

export default function AdminLensPackagesPage() {
  const { items, form, ui, actions, popupElement } = useAdminLensPackagesPage();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Goi Trong Kinh</h1>
        <button
          type="button"
          onClick={actions.retry}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold"
        >
          Tai lai
        </button>
      </div>

      {ui.error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{ui.error}</p> : null}

      <form onSubmit={actions.createLens} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Tao goi moi</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input
            value={form.lensCode}
            onChange={(event) => actions.setFormField("lensCode", event.target.value)}
            placeholder="Ma lens"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <input
            value={form.lensName}
            onChange={(event) => actions.setFormField("lensName", event.target.value)}
            placeholder="Ten lens"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(event) => actions.setFormField("price", event.target.value)}
            placeholder="Gia"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <input
            value={form.description}
            onChange={(event) => actions.setFormField("description", event.target.value)}
            placeholder="Mo ta"
            className="rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <button type="submit" className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
          Tao
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Ma</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Ten</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Gia</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Trang thai</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!ui.isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  Khong co du lieu.
                </td>
              </tr>
            ) : null}

            {items.map((item) => (
              <tr key={item.lensTypeId}>
                <td className="px-4 py-3 text-sm text-gray-700">{item.lensTypeId}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.lensCode}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.lensName}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{Number(item.price).toLocaleString("vi-VN")} d</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.isActive ? "Hoat dong" : "Ngung"}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => actions.editLens(item)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Sua
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.toggleLens(item)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      {item.isActive ? "Khoa" : "Mo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.deleteLens(item)}
                      className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700"
                    >
                      Xoa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {popupElement}
    </div>
  );
}
